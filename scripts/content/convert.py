"""Untrusted document conversion. Run inside the networkless, credential-free container."""
import json,sys,os,subprocess,html
from pathlib import Path
MAX_PAGES=30

def convert(source,output):
    source=Path(source).resolve();output=Path(output);output.mkdir(parents=True,exist_ok=True)
    ext=source.suffix.lower();paths=[]
    if ext in {'.png','.jpg','.jpeg','.webp','.bmp','.gif','.tif','.tiff','.avif','.heic','.heif'}:
        from PIL import Image,ImageOps
        import pillow_heif
        pillow_heif.register_heif_opener();Image.MAX_IMAGE_PIXELS=40_000_000
        with Image.open(source) as image:
            # TIFF pages are documents; animated formats use the first complete frame.
            count=getattr(image,'n_frames',1) if ext in {'.tif','.tiff'} else 1
            if count>MAX_PAGES:raise ValueError('O arquivo excede 30 páginas.')
            for i in range(count):
                image.seek(i);frame=ImageOps.exif_transpose(image.copy()).convert('RGB');frame.thumbnail((3840,2160));p=output/f'{i+1}.png';frame.save(p);paths.append(p)
    elif ext in {'.html','.htm','.svg','.txt','.md'}:
        from playwright.sync_api import sync_playwright
        text=source.read_text(encoding='utf-8-sig')
        if len(text)>5_000_000:raise ValueError('HTML/texto muito grande.')
        if ext=='.md':
            import markdown
            text=markdown.markdown(text)
        if ext in {'.txt','.md'}:
            text='<style>body{background:#08090b;color:#fff;font:32px/1.5 Arial;padding:50px;margin:0;overflow-wrap:anywhere}pre{white-space:pre-wrap;font:inherit}</style>'+('<pre>'+html.escape(text)+'</pre>' if ext=='.txt' else text)
        with sync_playwright() as p:
            browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
            page=browser.new_page(viewport={'width':1920,'height':1080},java_script_enabled=False)
            page.route('**/*',lambda route:route.abort())
            page.set_content(text,wait_until='load',timeout=15000)
            page.emulate_media(media='print')
            width=page.evaluate('Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)')
            if width>7680:raise ValueError('HTML muito largo; reduza a largura antes de enviar.')
            scale=min(1,1920/max(width,1))
            # Print pagination avoids slicing text at arbitrary screenshot boundaries.
            pdf=output/'source.pdf';page.pdf(path=str(pdf),scale=scale,width='1920px',height='1080px',print_background=True,prefer_css_page_size=False,margin={'top':'0','bottom':'0','left':'0','right':'0'})
            browser.close()
        return convert(pdf,output)
    else:
        pdf=source
        if ext!='.pdf':
            if ext not in {'.doc','.docx','.odt','.rtf','.ppt','.pptx','.odp','.xls','.xlsx','.ods'}:raise ValueError('Formato não suportado.')
            profile=Path('/tmp/mansoes-lo');profile.mkdir(exist_ok=True)
            # Disable macro execution; no network is available in the container.
            user=profile/'user';user.mkdir(exist_ok=True)
            (user/'registrymodifications.xcu').write_text('<?xml version="1.0"?><oor:items xmlns:oor="http://openoffice.org/2001/registry"><item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="MacroSecurityLevel" oor:op="fuse"><value>3</value></prop></item></oor:items>')
            subprocess.run(['libreoffice','-env:UserInstallation='+profile.as_uri(),'--headless','--convert-to','pdf','--outdir',str(output),str(source)],check=True,timeout=120,capture_output=True)
            pdf=output/(source.stem+'.pdf')
            if not pdf.exists():raise ValueError('Não foi possível converter o documento. Tente exportar como PDF.')
        import pymupdf
        with pymupdf.open(pdf) as doc:
            if doc.needs_pass:raise ValueError('Remova a senha do PDF antes de enviar.')
            if not 0<len(doc)<=MAX_PAGES:raise ValueError('O documento deve ter de 1 a 30 páginas.')
            for i,page in enumerate(doc):
                scale=min(3840/page.rect.width,2160/page.rect.height,2.5)
                pix=page.get_pixmap(matrix=pymupdf.Matrix(scale,scale),alpha=False)
                path=output/f'{i+1}.png';pix.save(path);paths.append(path)
    if not paths:raise ValueError('Nenhuma página foi produzida.')
    return paths
if __name__=='__main__':
    try:
        paths=convert(sys.argv[1],sys.argv[2]);print(json.dumps({'pages':[str(p) for p in paths]}))
    except Exception as e:
        print(str(e),file=sys.stderr);sys.exit(1)
