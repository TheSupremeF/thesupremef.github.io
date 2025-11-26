/**
 * XLSX Template Patcher - Pure JavaScript
 * Patches sheet1.xml only, preserves all other files
 */

class XLSXPatcher {
    constructor() {
        this.printTitleRows = 7;
        this.NS = {
            main: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
            r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
            mc: 'http://schemas.openxmlformats.org/markup-compatibility/2006',
            x14ac: 'http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac'
        };
    }
    
    formatADA(ada, parsel) {
        return ada === 1 ? "ADA 1" : `ADA ${ada} PARSEL ${parsel}`;
    }
    
    formatDate(date) {
        const d = date instanceof Date ? date : new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    }
    
    async readPrintTitles(zip) {
        const workbookXML = await zip.file('xl/workbook.xml').async('string');
        const match = workbookXML.match(/_xlnm\.Print_Titles[^>]*>([^<]+)<\/definedName>/);
        if (match) {
            const rowMatch = match[1].match(/\$(\d+):\$(\d+)/);
            if (rowMatch) {
                return parseInt(rowMatch[2]);
            }
        }
        return 7;
    }
    
    createInlineStringCell(doc, cellRef, text, style = '7') {
        const ns = this.NS.main;
        const cell = doc.createElementNS(ns, 'c');
        cell.setAttribute('r', cellRef);
        cell.setAttribute('s', style);
        cell.setAttribute('t', 'inlineStr');
        
        const is = doc.createElementNS(ns, 'is');
        const t = doc.createElementNS(ns, 't');
        t.textContent = String(text);
        
        is.appendChild(t);
        cell.appendChild(is);
        
        return cell;
    }
    
    updateCell(doc, sheetData, rowNum, colLetter, text) {
        const ns = this.NS.main;
        const cellRef = `${colLetter}${rowNum}`;
        
        let row = null;
        const rows = sheetData.getElementsByTagNameNS(ns, 'row');
        for (let r of rows) {
            if (r.getAttribute('r') === String(rowNum)) {
                row = r;
                break;
            }
        }
        
        if (!row) return;
        
        let cell = null;
        const cells = row.getElementsByTagNameNS(ns, 'c');
        for (let c of cells) {
            if (c.getAttribute('r') === cellRef) {
                cell = c;
                break;
            }
        }
        
        if (!cell) {
            cell = doc.createElementNS(ns, 'c');
            cell.setAttribute('r', cellRef);
            row.appendChild(cell);
        }
        
        // Preserve existing style attribute (s="...")
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
    
    patchSheetXML(sheetXMLString, dataRows, headerInfo) {
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
        
        // Update header cells (preserve existing styles!)
        if (headerInfo) {
            if (headerInfo.projectName) {
                this.updateCell(doc, sheetData, 1, 'A', headerInfo.projectName);
            }
            if (headerInfo.date) {
                const dateStr = this.formatDate(headerInfo.date);
                this.updateCell(doc, sheetData, 3, 'B', dateStr);
            }
            if (headerInfo.imalatTuru) {
                this.updateCell(doc, sheetData, 5, 'B', headerInfo.imalatTuru);
            }
        }
        
        // Remove rows > printTitleRows
        const rowsToRemove = [];
        const rows = sheetData.getElementsByTagNameNS(ns, 'row');
        
        for (let row of rows) {
            const r = parseInt(row.getAttribute('r'));
            if (r > this.printTitleRows) {
                rowsToRemove.push(row);
            }
        }
        
        for (let row of rowsToRemove) {
            sheetData.removeChild(row);
        }
        
        // Add new data rows
        const startRow = this.printTitleRows + 1;
        
        for (let idx = 0; idx < dataRows.length; idx++) {
            const data = dataRows[idx];
            const rowNum = startRow + idx;
            
            const colAText = this.formatADA(data.ADA, data.PARSEL);
            const colBText = data.blokAdi || '';
            
            const row = doc.createElementNS(ns, 'row');
            row.setAttribute('r', String(rowNum));
            row.setAttribute('spans', '1:2');
            row.setAttributeNS(this.NS.x14ac, 'x14ac:dyDescent', '0.3');
            
            const cellA = this.createInlineStringCell(doc, `A${rowNum}`, colAText, '7');
            const cellB = this.createInlineStringCell(doc, `B${rowNum}`, colBText, '7');
            
            row.appendChild(cellA);
            row.appendChild(cellB);
            sheetData.appendChild(row);
        }
        
        // Update dimension
        const dimension = doc.getElementsByTagNameNS(ns, 'dimension')[0];
        if (dimension && dataRows.length > 0) {
            const lastRow = startRow + dataRows.length - 1;
            dimension.setAttribute('ref', `A1:B${lastRow}`);
        }
        
        // Serialize
        const serializer = new XMLSerializer();
        let xmlString = serializer.serializeToString(doc);
        
        if (!xmlString.startsWith('<?xml')) {
            xmlString = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + xmlString;
        }
        
        return xmlString;
    }
    
    async patch(templateFile, dataRows, headerInfo = {}) {
        const zip = await JSZip.loadAsync(templateFile);
        
        this.printTitleRows = await this.readPrintTitles(zip);
        
        const sheetXMLString = await zip.file('xl/worksheets/sheet1.xml').async('string');
        const patchedSheetXML = this.patchSheetXML(sheetXMLString, dataRows, headerInfo);
        
        zip.file('xl/worksheets/sheet1.xml', patchedSheetXML);
        
        const blob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });
        
        return blob;
    }
    
    validateData(data) {
        const errors = [];
        
        if (!Array.isArray(data)) {
            return { valid: false, errors: ['Data must be an array'] };
        }
        
        if (data.length === 0) {
            return { valid: false, errors: ['Data array is empty'] };
        }
        
        data.forEach((item, idx) => {
            if (typeof item !== 'object' || item === null) {
                errors.push(`Item ${idx} is not an object`);
                return;
            }
            
            if (!('ADA' in item)) {
                errors.push(`Item ${idx} missing 'ADA' field`);
            }
            
            if (!('PARSEL' in item)) {
                errors.push(`Item ${idx} missing 'PARSEL' field`);
            }
            
            // blokAdi is optional
            if ('blokAdi' in item && typeof item.blokAdi !== 'string') {
                errors.push(`Item ${idx} has invalid 'blokAdi' field (must be string)`);
            }
        });
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = XLSXPatcher;
}

if (typeof window !== 'undefined') {
    window.XLSXPatcher = XLSXPatcher;
}
