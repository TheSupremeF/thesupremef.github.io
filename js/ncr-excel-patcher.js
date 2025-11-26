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
        
        const runs = []; // Array of {text, bold, italic, fontSize, fontFamily}
        
        // Process nodes recursively
        const processNode = (node, inheritedStyles = {}) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                if (text.length > 0) {
                    runs.push({
                        text: text,
                        bold: inheritedStyles.bold || false,
                        italic: inheritedStyles.italic || false,
                        fontSize: inheritedStyles.fontSize || '11',
                        fontFamily: 'Times New Roman' // Always use Times New Roman
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
                    runs.push({ text: '\n', bold: false, italic: false, fontSize: '11', fontFamily: 'Times New Roman' });
                } else if (tag === 'p' || tag === 'div') {
                    Array.from(node.childNodes).forEach(child => processNode(child, newStyles));
                    // Add newline after block elements (but not if last element)
                    if (node.nextSibling) {
                        runs.push({ text: '\n', bold: false, italic: false, fontSize: '11', fontFamily: 'Times New Roman' });
                    }
                } else if (tag === 'ul' || tag === 'ol') {
                    let index = 1;
                    Array.from(node.children).forEach(li => {
                        if (li.tagName.toLowerCase() === 'li') {
                            const prefix = tag === 'ul' ? '• ' : `${index}. `;
                            runs.push({ text: prefix, bold: false, italic: false, fontSize: '11', fontFamily: 'Times New Roman' });
                            Array.from(li.childNodes).forEach(child => processNode(child, newStyles));
                            runs.push({ text: '\n', bold: false, italic: false, fontSize: '11', fontFamily: 'Times New Roman' });
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
                last.fontSize === run.fontSize &&
                last.fontFamily === run.fontFamily) {
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
            
            // Always add run properties for font family
            const rPr = doc.createElementNS(ns, 'rPr');
            
            // Font family (Times New Roman)
            const rFont = doc.createElementNS(ns, 'rFont');
            rFont.setAttribute('val', run.fontFamily || 'Times New Roman');
            rPr.appendChild(rFont);
            
            // Bold
            if (run.bold) {
                const b = doc.createElementNS(ns, 'b');
                rPr.appendChild(b);
            }
            
            // Italic
            if (run.italic) {
                const i = doc.createElementNS(ns, 'i');
                rPr.appendChild(i);
            }
            
            // Font size
            const sz = doc.createElementNS(ns, 'sz');
            sz.setAttribute('val', run.fontSize || '11');
            rPr.appendChild(sz);
            
            r.appendChild(rPr);
            
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
    
    updateCellToRichImage(doc, sheetData, cellRef, vmIndex) {
        const ns = this.NS.main;
        
        // Find cell
        const cells = sheetData.getElementsByTagNameNS(ns, 'c');
        let cell = null;
        let cellParent = null;
        let nextSibling = null;
        
        for (let c of cells) {
            if (c.getAttribute('r') === cellRef) {
                cell = c;
                cellParent = cell.parentNode;
                nextSibling = cell.nextSibling;
                break;
            }
        }
        
        if (!cell) {
            console.warn(`Cell ${cellRef} not found`);
            return;
        }
        
        // Preserve existing style
        const existingStyle = cell.getAttribute('s');
        
        // Remove old cell
        cellParent.removeChild(cell);
        
        // Create new cell element with correct attribute order
        const newCell = doc.createElementNS(ns, 'c');
        newCell.setAttribute('r', cellRef);
        if (existingStyle) {
            newCell.setAttribute('s', existingStyle);
        }
        newCell.setAttribute('t', 'e'); // Error type
        newCell.setAttribute('vm', String(vmIndex)); // Rich value metadata index
        
        // Add #VALUE! as cell value
        const v = doc.createElementNS(ns, 'v');
        v.textContent = '#VALUE!';
        newCell.appendChild(v);
        
        // Insert new cell back in same position
        if (nextSibling) {
            cellParent.insertBefore(newCell, nextSibling);
        } else {
            cellParent.appendChild(newCell);
        }
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
        
        // A10, B10, C10: Photo cells with rich value images (Place in cell)
        // These behave exactly like the image in A2
        if (ncrData.photos && ncrData.photos.length > 0) {
            this.updateCellToRichImage(doc, sheetData, 'A10', 4); // vm="4"
        }
        if (ncrData.photos && ncrData.photos.length > 1) {
            this.updateCellToRichImage(doc, sheetData, 'B10', 5); // vm="5"
        }
        if (ncrData.photos && ncrData.photos.length > 2) {
            this.updateCellToRichImage(doc, sheetData, 'C10', 6); // vm="6"
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
                // Use image4.jpg, image5.jpg, image6.jpg (image1-3 are template images)
                zip.file(`xl/media/image${i + 4}.jpg`, imageBlob);
            }
        }
        
        // 2. Update rich value data (rdrichvalue.xml)
        await this.updateRichValueData(zip, photoCount);
        
        // 3. Update rich value relationships (richValueRel.xml)
        await this.updateRichValueRel(zip, photoCount);
        
        // 4. Update rich value relationship targets (richValueRel.xml.rels)
        await this.updateRichValueRelRels(zip, photoCount);
        
        // 5. Update metadata.xml with new rich value entries
        await this.updateMetadata(zip, photoCount);
        
        // 6. Update [Content_Types].xml
        await this.updateContentTypes(zip);
    }
    
    async updateMetadata(zip, photoCount) {
        const metadataFile = zip.file('xl/metadata.xml');
        let metadataContent = await metadataFile.async('string');
        
        // Parse existing counts (template has 3)
        const futureMatch = metadataContent.match(/<futureMetadata[^>]*count="(\d+)"/);
        const valueMatch = metadataContent.match(/<valueMetadata[^>]*count="(\d+)"/);
        
        const existingCount = futureMatch ? parseInt(futureMatch[1]) : 3;
        const newCount = existingCount + photoCount;
        
        // Update futureMetadata count
        metadataContent = metadataContent.replace(
            /<futureMetadata([^>]*)count="\d+"/,
            `<futureMetadata$1count="${newCount}"`
        );
        
        // Update valueMetadata count
        metadataContent = metadataContent.replace(
            /<valueMetadata([^>]*)count="\d+"/,
            `<valueMetadata$1count="${newCount}"`
        );
        
        // Add new futureMetadata entries before </futureMetadata>
        let newFutureEntries = '';
        for (let i = 0; i < photoCount; i++) {
            const index = existingCount + i; // 3, 4, 5
            newFutureEntries += `<bk><extLst><ext uri="{3e2802c4-a4d2-4d8b-9148-e3be6c30e623}"><xlrd:rvb i="${index}"/></ext></extLst></bk>`;
        }
        
        metadataContent = metadataContent.replace('</futureMetadata>', `${newFutureEntries}</futureMetadata>`);
        
        // Add new valueMetadata entries before </valueMetadata>
        let newValueEntries = '';
        for (let i = 0; i < photoCount; i++) {
            const index = existingCount + i; // 3, 4, 5
            newValueEntries += `<bk><rc t="1" v="${index}"/></bk>`;
        }
        
        metadataContent = metadataContent.replace('</valueMetadata>', `${newValueEntries}</valueMetadata>`);
        
        zip.file('xl/metadata.xml', metadataContent);
    }
    
    async updateRichValueData(zip, photoCount) {
        const rvDataFile = zip.file('xl/richData/rdrichvalue.xml');
        let rvDataContent = await rvDataFile.async('string');
        
        // Parse existing count (template has 3)
        const countMatch = rvDataContent.match(/count="(\d+)"/);
        const existingCount = countMatch ? parseInt(countMatch[1]) : 3;
        const newCount = existingCount + photoCount;
        
        // Update count
        rvDataContent = rvDataContent.replace(/count="\d+"/, `count="${newCount}"`);
        
        // Add new rich value entries before </rvData>
        let newEntries = '';
        for (let i = 0; i < photoCount; i++) {
            const imageIndex = existingCount + i; // 3, 4, 5
            newEntries += `<rv s="0"><v>${imageIndex}</v><v>5</v></rv>`;
        }
        
        rvDataContent = rvDataContent.replace('</rvData>', `${newEntries}</rvData>`);
        
        zip.file('xl/richData/rdrichvalue.xml', rvDataContent);
    }
    
    async updateRichValueRel(zip, photoCount) {
        const rvRelFile = zip.file('xl/richData/richValueRel.xml');
        let rvRelContent = await rvRelFile.async('string');
        
        // Add new rel entries before </richValueRels>
        let newRels = '';
        for (let i = 0; i < photoCount; i++) {
            const rId = i + 4; // rId4, rId5, rId6
            newRels += `<rel r:id="rId${rId}"/>`;
        }
        
        rvRelContent = rvRelContent.replace('</richValueRels>', `${newRels}</richValueRels>`);
        
        zip.file('xl/richData/richValueRel.xml', rvRelContent);
    }
    
    async updateRichValueRelRels(zip, photoCount) {
        const rvRelRelsFile = zip.file('xl/richData/_rels/richValueRel.xml.rels');
        let rvRelRelsContent = await rvRelRelsFile.async('string');
        
        // Add new relationship entries before </Relationships>
        let newRelationships = '';
        for (let i = 0; i < photoCount; i++) {
            const rId = i + 4; // rId4, rId5, rId6
            const imageId = i + 4; // image4.jpg, image5.jpg, image6.jpg
            newRelationships += `<Relationship Id="rId${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${imageId}.jpg"/>`;
        }
        
        rvRelRelsContent = rvRelRelsContent.replace('</Relationships>', `${newRelationships}</Relationships>`);
        
        zip.file('xl/richData/_rels/richValueRel.xml.rels', rvRelRelsContent);
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
