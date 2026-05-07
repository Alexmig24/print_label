/** @odoo-module **/

export function exportJSON() {
    const json = this.canvas.toJSON();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'etiqueta.json';
    link.click();
}

export function loadJSON(json) {
    this.canvas.loadFromJSON(json, async () => {
        const objects = this.canvas.getObjects();

        for (let obj of objects) {
            if (obj.objectType === 'barcode') {
                const value = obj.barcodeValue || '000000';
                const format = obj.barcodeFormat || 'CODE128';

                let dataUrl;
                if (format === 'QR') {
                    dataUrl = await QRCode.toDataURL(value, {
                        width: 150,
                        margin: 0,
                        errorCorrectionLevel: 'M',
                    });
                } else {
                    const tempCanvas = document.createElement('canvas');
                    JsBarcode(tempCanvas, value, {
                        format: format,
                        displayValue: false,
                        margin: 0,
                    });
                    dataUrl = tempCanvas.toDataURL("image/png");
                }

                const imgEl = new Image();
                await new Promise(resolve => {
                    imgEl.onload = resolve;
                    imgEl.src = dataUrl;
                });

                obj.setElement(imgEl);
                obj.scaleX = obj.scaleX || 1;
                obj.scaleY = obj.scaleY || 1;
                obj.setCoords();
            }
        }

        this.canvas.renderAll();
    }, { fieldKey: null, objectType: null, barcodeValue: null, barcodeFormat: null, customExpression: null });
}

export async function _restoreBarcode(meta, originalFabricObj = {}) {
    const value = meta.barcodeValue || '000000';
    const format = meta.barcodeFormat || 'CODE128';

    let dataUrl;
    if (format === 'QR') {
        dataUrl = await QRCode.toDataURL(value, {
            width: 150,
            margin: 0,
            errorCorrectionLevel: 'M',
        });
    } else {
        const tempCanvas = document.createElement('canvas');
        JsBarcode(tempCanvas, value, {
            format: format,
            displayValue: false,
            margin: 0,
        });
        dataUrl = tempCanvas.toDataURL("image/png");
    }

    return new Promise(resolve => {
        const imgEl = new Image();
        imgEl.onload = () => {
            const fabricImg = new fabric.Image(imgEl, {
                left:   originalFabricObj.left   || 0,
                top:    originalFabricObj.top     || 0,
                scaleX: originalFabricObj.scaleX  || 1,
                scaleY: originalFabricObj.scaleY  || 1,
                angle:  originalFabricObj.angle   || 0,
            });

            fabricImg.fieldKey      = meta.fieldKey;
            fabricImg.objectType    = 'barcode';
            fabricImg.barcodeValue  = value;
            fabricImg.barcodeFormat = format;
            if (meta.customExpression) fabricImg.customExpression = meta.customExpression;

            this.canvas.add(fabricImg);
            resolve();
        };
        imgEl.src = dataUrl;
    });
}
