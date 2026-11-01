"""Content jobs only: no publication, no Pages deployment, no execution of uploaded code."""
import os,json,re,base64,hashlib,time,urllib.request,urllib.error,subprocess,tempfile
from pathlib import Path
REPO=os.environ.get('GITHUB_REPOSITORY','agelgustavo/cross-mansoes-tv')
BRANCH='workout-content-homolog'
TOKEN=os.environ.get('GH_TOKEN','')

def api(path,method='GET',data=None):
    req=urllib.request.Request('https://api.github.com/repos/'+REPO+path,data=json.dumps(data).encode() if data is not None else None,method=method,headers={'Authorization':'Bearer '+TOKEN,'Accept':'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'})
    with urllib.request.urlopen(req,timeout=60) as r:return json.load(r) if r.status!=204 else None

def read(path):
    try:
        r=api('/contents/'+path+'?ref='+BRANCH);return json.loads(base64.b64decode(r['content'])),r['sha']
    except urllib.error.HTTPError as e:
        if e.code==404:return None,None
        raise

def put(path,data):
    # Content API serializes against the file SHA, avoiding lost updates.
    for attempt in range(5):
        _,sha=read(path)
        body={'message':'content(homolog): '+path,'branch':BRANCH,'content':base64.b64encode((json.dumps(data,ensure_ascii=False,indent=2)+'\n').encode()).decode()}
        if sha:body['sha']=sha
        try:return api('/contents/'+path,'PUT',body)
        except urllib.error.HTTPError as e:
            if e.code not in {409,422} or attempt==4:raise
            time.sleep(2**attempt)

def upload(path,data):
    try:api('/contents/'+path+'?ref='+BRANCH);return
    except urllib.error.HTTPError as e:
        if e.code!=404:raise
    for attempt in range(5):
        try:return api('/contents/'+path,'PUT',{'message':'content(homolog): arquivo convertido','branch':BRANCH,'content':base64.b64encode(data).decode()})
        except urllib.error.HTTPError as e:
            if e.code not in {409,422} or attempt==4:raise
            time.sleep(2**attempt)
            try:api('/contents/'+path+'?ref='+BRANCH);return
            except urllib.error.HTTPError:pass

def process(job,root):
    if job.get('mode') not in {'crossfit','hybrid'}:raise ValueError('Modalidade inválida.')
    output=root/'output';output.mkdir()
    if job['kind']=='health':return []
    if job['kind']=='generate':
        key=os.environ.get('OPENAI_API_KEY','')
        if not key:raise ValueError('IA não ativada. Cadastre OPENAI_API_KEY nos segredos do GitHub.')
        text=job.get('text','');prompt=job.get('prompt','')
        if not isinstance(text,str) or not text.strip() or len(text)>20000 or len(prompt)>8000:raise ValueError('Treino/prompt vazio ou muito longo.')
        standard=Path('MANSOES_BRAND_STANDARD.md').read_text()
        instruction=f'Crie UMA arte horizontal 16:9 para TV, incluindo os textos. Modalidade: {job["mode"]}. Título da página: {job.get("title", "WOD")}. Preserve exatamente todos os exercícios, números, cargas e categorias. Não invente dados. Paleta preto/vermelho/branco CrossFit ou preto/azul/branco Hybrid Run. Priorize leitura à distância.\nPADRÃO DA MARCA:\n{standard}\nTREINO (dados a preservar):\n{text}\nDIREÇÃO VISUAL DO USUÁRIO:\n{prompt}'
        req=urllib.request.Request('https://api.openai.com/v1/images/generations',data=json.dumps({'model':os.environ.get('OPENAI_IMAGE_MODEL') or 'gpt-image-2','prompt':instruction,'size':'1536x864','quality':'high','n':1}).encode(),headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'})
        # A generation request is never automatically retried (avoids duplicate charges).
        try:
            with urllib.request.urlopen(req,timeout=600) as r:data=json.load(r)
        except urllib.error.HTTPError as e:raise ValueError(f'A geração OpenAI falhou (HTTP {e.code}). Confira a chave, o saldo e o acesso ao modelo.') from None
        path=output/'1.png';path.write_bytes(base64.b64decode(data['data'][0]['b64_json']));return [path]
    if job['kind']!='convert':raise ValueError('Tipo de processamento inválido.')
    source=job.get('sourcePath','')
    if not re.fullmatch(r'sources/[a-f0-9]{64}\.(pdf|html|htm|svg|txt|md|docx?|odt|rtf|pptx?|odp|xlsx?|ods|png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif)',source):raise ValueError('Arquivo de origem inválido.')
    data=api('/contents/'+source+'?ref='+BRANCH)
    # Git blobs support base64 for files larger than the Contents inline limit.
    blob=api('/git/blobs/'+data['sha']);content=base64.b64decode(blob['content'])
    if not 0<len(content)<=25*1024*1024:raise ValueError('Arquivo vazio ou maior que 25 MB.')
    if hashlib.sha256(content).hexdigest()!=source.split('/')[1].split('.')[0]:raise ValueError('Integridade do arquivo inválida.')
    inputs=root/'input';inputs.mkdir();path=inputs/('source.'+source.rsplit('.',1)[1]);path.write_bytes(content)
    # Only two folders enter the converter. No GitHub/OpenAI token, network or repository mounts.
    result=subprocess.run(['docker','run','--rm','--user',f'{os.getuid()}:{os.getgid()}','--network','none','--memory','1536m','--cpus','2','--pids-limit','512','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--tmpfs','/tmp:rw,size=512m','-v',str(inputs)+':/input:ro','-v',str(output)+':/output:rw','mansoes-converter','/input/'+path.name,'/output'],capture_output=True,text=True,timeout=240)
    if result.returncode:raise ValueError('Não foi possível converter o arquivo. Verifique se está íntegro e sem senha; você também pode exportá-lo como PDF.')
    paths=sorted(output.glob('[0-9]*.png'),key=lambda p:int(p.stem))
    if not 0<len(paths)<=30:raise ValueError('O resultado deve ter de 1 a 30 páginas.')
    return paths

def main():
    jobid=os.environ.get('JOB_ID','')
    if not re.fullmatch(r'[a-f0-9-]{36}',jobid):raise ValueError('Pedido inválido.')
    path='jobs/'+jobid+'.json';job,_=read(path)
    if not job:raise ValueError('Pedido não encontrado.')
    if job.get('status')=='complete':return
    if job.get('status')=='processing':raise ValueError('Pedido já iniciado. Para evitar duplicidade, crie outro pedido se a execução anterior falhou.')
    job.update(status='processing',startedAt=time.time());put(path,job)
    try:
        with tempfile.TemporaryDirectory() as directory:
            pages=process(job,Path(directory));assets=[]
            for p in pages:
                content=p.read_bytes();target='media/'+hashlib.sha256(content).hexdigest()+'.png';upload(target,content);assets.append({'path':target})
        job.update(status='complete',pages=assets,completedAt=time.time(),ai=bool(os.environ.get('OPENAI_API_KEY')));job.pop('error',None)
    except Exception as e:
        # Only controlled errors reach the UI; API payloads and credentials never do.
        job.update(status='failed',error=str(e) if isinstance(e,ValueError) else 'Falha no processamento. Consulte a execução no GitHub e tente novamente.')
    put(path,job)
    put('capabilities.json',{'ai':bool(os.environ.get('OPENAI_API_KEY')),'updatedAt':time.time()})
    if job['status']=='failed':raise SystemExit(1)
if __name__=='__main__':main()
