/**
 * NCR Excel Patcher
 * Fills NCR.xlsx template with data
 */

class NCRExcelPatcher {
    constructor() {
        this.NS = {
            main: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
            r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
        };
    }
    
    formatDate(date) {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    }
    
    convertWysiwygToRichText(html) {
        if (!html || html.trim() === '') return null;
        
        // Create temporary div to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        const runs = []; // Array of {text, bold, italic, fontSize}
        
        // Process nodes recursively
        const processNode = (node, inheritedStyles = {}) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                if (text.length > 0) {
                    runs.push({
                        text: text,
                        bold: inheritedStyles.bold || false,
                        italic: inheritedStyles.italic || false,
                        fontSize: inheritedStyles.fontSize || '11'
                    });
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tag = node.tagName.toLowerCase();
                const newStyles = { ...inheritedStyles };
                
                // Check for bold
                if (tag === 'b' || tag === 'strong') {
                    newStyles.bold = true;
                }
                
                // Check for italic
                if (tag === 'i' || tag === 'em') {
                    newStyles.italic = true;
                }
                
                // Check for font size in span
                if (tag === 'span' && node.style.fontSize) {
                    // Extract number from "10pt" or "10px"
                    const sizeMatch = node.style.fontSize.match(/(\d+)/);
                    if (sizeMatch) {
                        newStyles.fontSize = sizeMatch[1];
                    }
                }
                
                // Handle line breaks
                if (tag === 'br') {
                    runs.push({ text: '\n', bold: false, italic: false, fontSize: '11' });
                } else if (tag === 'p' || tag === 'div') {
                    Array.from(node.childNodes).forEach(child => processNode(child, newStyles));
                    // Add newline after block elements (but not if last element)
                    if (node.nextSibling) {
                        runs.push({ text: '\n', bold: false, italic: false, fontSize: '11' });
                    }
                } else if (tag === 'ul' || tag === 'ol') {
                    let index = 1;
                    Array.from(node.children).forEach(li => {
                        if (li.tagName.toLowerCase() === 'li') {
                            const prefix = tag === 'ul' ? '• ' : `${index}. `;
                            runs.push({ text: prefix, bold: false, italic: false, fontSize: '11' });
                            Array.from(li.childNodes).forEach(child => processNode(child, newStyles));
                            runs.push({ text: '\n', bold: false, italic: false, fontSize: '11' });
                            index++;
                        }
                    });
                } else {
                    // Process children with inherited styles
                    Array.from(node.childNodes).forEach(child => processNode(child, newStyles));
                }
            }
        };
        
        Array.from(tempDiv.childNodes).forEach(child => processNode(child));
        
        // Merge consecutive runs with same formatting
        const mergedRuns = [];
        for (let run of runs) {
            const last = mergedRuns[mergedRuns.length - 1];
            if (last && 
                last.bold === run.bold && 
                last.italic === run.italic && 
                last.fontSize === run.fontSize) {
                last.text += run.text;
            } else {
                mergedRuns.push({ ...run });
            }
        }
        
        return mergedRuns.length > 0 ? mergedRuns : null;
    }
    
    convertWysiwygToText(html) {
        // Fallback for plain text export
        const richText = this.convertWysiwygToRichText(html);
        if (!richText) return '';
        return richText.map(r => r.text).join('');
    }
    
    updateCellValue(doc, sheetData, cellRef, text) {
        const ns = this.NS.main;
        
        // Find cell
        const cells = sheetData.getElementsByTagNameNS(ns, 'c');
        let cell = null;
        for (let c of cells) {
            if (c.getAttribute('r') === cellRef) {
                cell = c;
                break;
            }
        }
        
        if (!cell) {
            console.warn(`Cell ${cellRef} not found`);
            return;
        }
        
        // Preserve existing style
        const existingStyle = cell.getAttribute('s');
        
        // Remove existing children
        while (cell.firstChild) {
            cell.removeChild(cell.firstChild);
        }
        
        // Set type to inlineStr
        cell.setAttribute('t', 'inlineStr');
        
        // Restore style if it existed
        if (existingStyle) {
            cell.setAttribute('s', existingStyle);
        }
        
        // Add inline string
        const is = doc.createElementNS(ns, 'is');
        const t = doc.createElementNS(ns, 't');
        t.textContent = String(text);
        is.appendChild(t);
        cell.appendChild(is);
    }
    
    updateCellWithRichText(doc, sheetData, cellRef, richTextRuns) {
        const ns = this.NS.main;
        
        // Find cell
        const cells = sheetData.getElementsByTagNameNS(ns, 'c');
        let cell = null;
        for (let c of cells) {
            if (c.getAttribute('r') === cellRef) {
                cell = c;
                break;
            }
        }
        
        if (!cell) {
            console.warn(`Cell ${cellRef} not found`);
            return;
        }
        
        // Preserve existing style
        const existingStyle = cell.getAttribute('s');
        
        // Remove existing children
        while (cell.firstChild) {
            cell.removeChild(cell.firstChild);
        }
        
        // Set type to inlineStr
        cell.setAttribute('t', 'inlineStr');
        
        // Restore style if it existed
        if (existingStyle) {
            cell.setAttribute('s', existingStyle);
        }
        
        // Create inline string with rich text runs
        const is = doc.createElementNS(ns, 'is');
        
        for (let run of richTextRuns) {
            const r = doc.createElementNS(ns, 'r');
            
            // Add run properties if formatting exists
            if (run.bold || run.italic || run.fontSize !== '11') {
                const rPr = doc.createElementNS(ns, 'rPr');
                
                if (run.bold) {
                    const b = doc.createElementNS(ns, 'b');
                    rPr.appendChild(b);
                }
                
                if (run.italic) {
                    const i = doc.createElementNS(ns, 'i');
                    rPr.appendChild(i);
                }
                
                // Font size
                const sz = doc.createElementNS(ns, 'sz');
                sz.setAttribute('val', run.fontSize);
                rPr.appendChild(sz);
                
                r.appendChild(rPr);
            }
            
            // Add text
            const t = doc.createElementNS(ns, 't');
            t.textContent = run.text;
            
            // Preserve whitespace
            if (run.text.startsWith(' ') || run.text.endsWith(' ') || run.text.includes('\n')) {
                t.setAttribute('xml:space', 'preserve');
            }
            
            r.appendChild(t);
            is.appendChild(r);
        }
        
        cell.appendChild(is);
    }
    
    patchSheetXML(sheetXMLString, ncrData, projectInfo, location) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(sheetXMLString, 'text/xml');
        
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
            throw new Error('XML parse error: ' + parseError.textContent);
        }
        
        const ns = this.NS.main;
        const sheetData = doc.getElementsByTagNameNS(ns, 'sheetData')[0];
        if (!sheetData) {
            throw new Error('Could not find <sheetData> element');
        }
        
        // A1: Project name
        this.updateCellValue(doc, sheetData, 'A1', projectInfo.name || '<PROJECT NAME>');
        
        // B4: NCR Code
        const ncrCode = window.EPP.generateNCRCode({
            contractorCode: projectInfo.contractorCode || '',
            contractorShort: projectInfo.contractorShort || '',
            typeCode: ncrData.type,
            ncrNumber: ncrData.ncrNumber
        });
        this.updateCellValue(doc, sheetData, 'B4', ncrCode);
        
        // B5: Created Date (formatted)
        const formattedDate = this.formatDate(ncrData.createdDate);
        this.updateCellValue(doc, sheetData, 'B5', formattedDate);
        
        // B6: Contractor name
        this.updateCellValue(doc, sheetData, 'B6', projectInfo.contractor || '<CONTRACTOR>');
        
        // B7: Location (use provided location string)
        this.updateCellValue(doc, sheetData, 'B7', location || '');
        
        // A9: Description (preserve HTML formatting)
        const richTextRuns = this.convertWysiwygToRichText(ncrData.description);
        if (richTextRuns && richTextRuns.length > 0) {
            this.updateCellWithRichText(doc, sheetData, 'A9', richTextRuns);
        } else {
            this.updateCellValue(doc, sheetData, 'A9', '');
        }
        
        // A10, B10, C10: Photo labels
        // Images will be embedded separately in the ZIP
        if (ncrData.photos && ncrData.photos.length > 0) {
            this.updateCellValue(doc, sheetData, 'A10', 'Fotoğraf 1');
        }
        if (ncrData.photos && ncrData.photos.length > 1) {
            this.updateCellValue(doc, sheetData, 'B10', 'Fotoğraf 2');
        }
        if (ncrData.photos && ncrData.photos.length > 2) {
            this.updateCellValue(doc, sheetData, 'C10', 'Fotoğraf 3');
        }
        
        // B12: Control Engineer Date (formatted)
        const engineerDate = this.formatDate(ncrData.controlEngineer.date);
        this.updateCellValue(doc, sheetData, 'B12', engineerDate);
        
        // C12: Control Chief Date (formatted)
        const chiefDate = this.formatDate(ncrData.controlChief.date);
        this.updateCellValue(doc, sheetData, 'C12', chiefDate);
        
        // B13: Control Engineer Name
        this.updateCellValue(doc, sheetData, 'B13', ncrData.controlEngineer.name || '');
        
        // C13: Control Chief Name
        this.updateCellValue(doc, sheetData, 'C13', ncrData.controlChief.name || '');
        
        // B14, C14: Signatures (placeholder for now)
        this.updateCellValue(doc, sheetData, 'B14', '');
        this.updateCellValue(doc, sheetData, 'C14', '');
        
        // Serialize
        const serializer = new XMLSerializer();
        let xmlString = serializer.serializeToString(doc);
        
        if (!xmlString.startsWith('<?xml')) {
            xmlString = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + xmlString;
        }
        
        return xmlString;
    }
    
    async embedImages(zip, photos) {
        if (!photos || photos.length === 0) return;
        
        const photoCount = Math.min(photos.length, 3);
        
        // 1. Add images to xl/media/
        for (let i = 0; i < photoCount; i++) {
            const photo = photos[i];
            if (photo && photo.data) {
                const base64Data = photo.data.split(',')[1];
                const imageBlob = this.base64ToBlob(base64Data, 'image/jpeg');
                zip.file(`xl/media/image${i + 1}.jpg`, imageBlob);
            }
        }
        
        // 2. Create drawing XML with image anchors
        const drawingXML = this.createDrawingXML(photoCount);
        zip.file('xl/drawings/drawing1.xml', drawingXML);
        
        // 3. Create drawing relationships
        const drawingRels = this.createDrawingRels(photoCount);
        zip.file('xl/drawings/_rels/drawing1.xml.rels', drawingRels);
        
        // 4. Update worksheet relationships
        await this.updateWorksheetRels(zip);
        
        // 5. Update worksheet to reference drawing
        await this.updateWorksheetDrawing(zip);
        
        // 6. Update [Content_Types].xml
        await this.updateContentTypes(zip);
    }
    
    createDrawingXML(photoCount) {
        // Create drawing XML with anchors at A10, B10, C10
        // Use oneCellAnchor for absolute sizing (not tied to cell dimensions)
        // Max dimension: 130px ≈ 1.35 inches = 1,234,440 EMUs
        let xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">`;
        
        for (let i = 0; i < photoCount; i++) {
            const col = i; // Column A=0, B=1, C=2
            const imageId = i + 1;
            
            // Use absolute sizing - 120px max dimension (1,152,000 EMUs)
            // This is ~1.2 inches, which is safe for 130px limit
            // Images maintain aspect ratio via noChangeAspect="1"
            const maxDimension = 1152000; // 120px ≈ 1.2 inches
            
            xml += `
  <xdr:oneCellAnchor>
    <xdr:from>
      <xdr:col>${col}</xdr:col>
      <xdr:colOff>100000</xdr:colOff>
      <xdr:row>9</xdr:row>
      <xdr:rowOff>100000</xdr:rowOff>
    </xdr:from>
    <xdr:ext cx="${maxDimension}" cy="${maxDimension}"/>
    <xdr:pic>
      <xdr:nvPicPr>
        <xdr:cNvPr id="${imageId}" name="Picture ${imageId}"/>
        <xdr:cNvPicPr>
          <a:picLocks noChangeAspect="1"/>
        </xdr:cNvPicPr>
      </xdr:nvPicPr>
      <xdr:blipFill>
        <a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rId${imageId}"/>
        <a:stretch>
          <a:fillRect/>
        </a:stretch>
      </xdr:blipFill>
      <xdr:spPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="${maxDimension}" cy="${maxDimension}"/>
        </a:xfrm>
        <a:prstGeom prst="rect">
          <a:avLst/>
        </a:prstGeom>
      </xdr:spPr>
    </xdr:pic>
    <xdr:clientData/>
  </xdr:oneCellAnchor>`;
        }
        
        xml += `
</xdr:wsDr>`;
        
        return xml;
    }
    
    createDrawingRels(photoCount) {
        let xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`;
        
        for (let i = 0; i < photoCount; i++) {
            xml += `
  <Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${i + 1}.jpg"/>`;
        }
        
        xml += `
</Relationships>`;
        
        return xml;
    }
    
    async updateWorksheetRels(zip) {
        const relsPath = 'xl/worksheets/_rels/sheet1.xml.rels';
        let relsFile = zip.file(relsPath);
        let relsContent;
        
        if (relsFile) {
            relsContent = await relsFile.async('string');
            // Add drawing relationship if not present
            if (!relsContent.includes('drawing1.xml')) {
                relsContent = relsContent.replace(
                    '</Relationships>',
                    `  <Relationship Id="rIdDrawing1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>`
                );
            }
        } else {
            // Create new rels file
            relsContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdDrawing1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>`;
        }
        
        zip.file(relsPath, relsContent);
    }
    
    async updateWorksheetDrawing(zip) {
        const sheetFile = zip.file('xl/worksheets/sheet1.xml');
        let sheetContent = await sheetFile.async('string');
        
        // Add drawing reference if not present
        if (!sheetContent.includes('<drawing')) {
            // Add xmlns:r if not present
            if (!sheetContent.includes('xmlns:r=')) {
                sheetContent = sheetContent.replace(
                    '<worksheet xmlns=',
                    '<worksheet xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns='
                );
            }
            
            // Add drawing element before </worksheet>
            sheetContent = sheetContent.replace(
                '</worksheet>',
                `  <drawing r:id="rIdDrawing1"/>
</worksheet>`
            );
        }
        
        zip.file('xl/worksheets/sheet1.xml', sheetContent);
    }
    
    async updateContentTypes(zip) {
        const contentTypesFile = zip.file('[Content_Types].xml');
        let contentTypes = await contentTypesFile.async('string');
        
        // Add jpg extension if not present
        if (!contentTypes.includes('Extension="jpg"') && !contentTypes.includes('Extension="jpeg"')) {
            contentTypes = contentTypes.replace(
                '</Types>',
                `  <Default Extension="jpg" ContentType="image/jpeg"/>
</Types>`
            );
        }
        
        // Add drawing content type if not present
        if (!contentTypes.includes('/drawings/drawing1.xml')) {
            contentTypes = contentTypes.replace(
                '</Types>',
                `  <Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>
</Types>`
            );
        }
        
        zip.file('[Content_Types].xml', contentTypes);
    }
    
    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }
    
    async patch(templateFile, ncrData, projectInfo, location) {
        const zip = await JSZip.loadAsync(templateFile);
        
        const sheetXMLString = await zip.file('xl/worksheets/sheet1.xml').async('string');
        const patchedSheetXML = this.patchSheetXML(sheetXMLString, ncrData, projectInfo, location);
        
        zip.file('xl/worksheets/sheet1.xml', patchedSheetXML);
        
        // Embed images
        if (ncrData.photos && ncrData.photos.length > 0) {
            await this.embedImages(zip, ncrData.photos);
        }
        
        const blob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });
        
        return blob;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NCRExcelPatcher;
}

if (typeof window !== 'undefined') {
    window.NCRExcelPatcher = NCRExcelPatcher;
}
