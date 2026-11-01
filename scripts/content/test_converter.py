"""Executed in the exact production converter image, with networking disabled."""
import tempfile,subprocess,sys
from pathlib import Path
from PIL import Image
import pymupdf
from convert import convert
TEXT='WOD 31 - 20 Burpees - 60/42 Cal - 1.000 m Run'
with tempfile.TemporaryDirectory() as directory:
    root=Path(directory);fixtures=root/'fixtures';fixtures.mkdir()
    image=Image.new('RGB',(1920,1080),'#142535');image.save(fixtures/'sample.png');image.save(fixtures/'sample.jpg');image.save(fixtures/'sample.webp');image.save(fixtures/'sample.bmp');image.save(fixtures/'sample.gif');image.save(fixtures/'sample.tiff')
    document=pymupdf.open()
    for _ in range(2):page=document.new_page();page.insert_text((60,80),TEXT)
    document.save(fixtures/'sample.pdf');document.close()
    (fixtures/'sample.html').write_text('<html><style>h1{font-size:40px}</style><h1>'+TEXT+'</h1><script>document.body.innerHTML="WRONG"</script><img src="https://invalid.example/never-load.png"></html>')
    (fixtures/'sample.txt').write_text(TEXT);(fixtures/'sample.md').write_text('# '+TEXT)
    (fixtures/'sample.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="500"><rect width="1000" height="500" fill="black"/><text x="20" y="100" fill="white">'+TEXT+'</text></svg>')
    # Minimal, valid WordprocessingML package; no extra fixture dependency.
    from zipfile import ZipFile
    with ZipFile(fixtures/'sample.docx','w') as z:
        z.writestr('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
        z.writestr('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
        z.writestr('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>'+TEXT+'</w:t></w:r></w:p></w:body></w:document>')
    (fixtures/'sample.rtf').write_text('{\\rtf1\\ansi '+TEXT+'}')
    # Exercise legacy Word and OpenDocument using LibreOffice-created fixture files.
    for ext in ['doc','odt']:
        subprocess.run(['libreoffice','-env:UserInstallation=file:///tmp/fixture-profile','--headless','--convert-to',ext,'--outdir',str(fixtures),str(fixtures/'sample.docx')],check=True,capture_output=True,timeout=60)
    # A spreadsheet and presentation in their native OpenDocument format.
    for ext,body in [('ods','<office:spreadsheet><table:table table:name="WOD"><table:table-row><table:table-cell office:value-type="string"><text:p>'+TEXT+'</text:p></table:table-cell></table:table-row></table:table></office:spreadsheet>'),('odp','<office:presentation><draw:page draw:name="WOD"><draw:frame svg:x="1cm" svg:y="1cm" svg:width="20cm" svg:height="4cm"><draw:text-box><text:p>'+TEXT+'</text:p></draw:text-box></draw:frame></draw:page></office:presentation>')]:
        with ZipFile(fixtures/f'sample.{ext}','w') as z:
            mime='application/vnd.oasis.opendocument.'+('spreadsheet' if ext=='ods' else 'presentation')
            z.writestr('mimetype',mime)
            z.writestr('META-INF/manifest.xml','<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0"><manifest:file-entry manifest:full-path="/" manifest:media-type="'+mime+'"/><manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/></manifest:manifest>')
            z.writestr('content.xml','<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" office:version="1.2"><office:body>'+body+'</office:body></office:document-content>')
    for source,formats in [('ods',['xls','xlsx']),('odp',['ppt','pptx'])]:
        for ext in formats:subprocess.run(['libreoffice','-env:UserInstallation=file:///tmp/fixture-profile','--headless','--convert-to',ext,'--outdir',str(fixtures),str(fixtures/f'sample.{source}')],check=True,capture_output=True,timeout=60)
    count=0
    for source in sorted(fixtures.iterdir()):
        out=root/source.suffix[1:];pages=convert(source,out)
        assert pages and all(Image.open(p).width>0 for p in pages),source
        if source.suffix=='.pdf':assert len(pages)==2
        if source.suffix in {'.html','.txt','.md','.docx','.doc','.odt','.rtf'}:
            pdfs=list(out.glob('*.pdf'));assert pdfs,source
            with pymupdf.open(pdfs[0]) as pdf:
                text=' '.join(p.get_text() for p in pdf)
                assert '20 Burpees' in text and '60/42' in text,(source,text)
                assert 'WRONG' not in text
        count+=1;print(f'OK {source.suffix}: {len(pages)} página(s)',flush=True)
    assert count>=20,count
    (fixtures/'broken.pdf').write_text('invalid')
    try:convert(fixtures/'broken.pdf',root/'bad')
    except Exception:pass
    else:raise AssertionError('Corrupt PDF accepted')
    print(f'{count} formatos convertidos; PDF multipágina, dados e HTML sem scripts verificados.')
