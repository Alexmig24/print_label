/** @odoo-module **/

export function onDragStart(ev, field) {
    ev.dataTransfer.setData('fieldKey',         field.key);
    ev.dataTransfer.setData('fieldType',        field.type);
    ev.dataTransfer.setData('fieldPlaceholder', field.placeholder);
    ev.dataTransfer.effectAllowed = 'copy';
}

export function onDragOver(ev) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'copy';
    this.state.isDraggingOver = true;
}

export function onDragLeave() {
    this.state.isDraggingOver = false;
}

export function onDrop(ev) {
    ev.preventDefault();
    this.state.isDraggingOver = false;

    const fieldKey         = ev.dataTransfer.getData('fieldKey');
    const fieldType        = ev.dataTransfer.getData('fieldType');
    const fieldPlaceholder = ev.dataTransfer.getData('fieldPlaceholder');

    const canvasEl = this.refsCanvas.el;
    const rect = canvasEl.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;

    if (fieldType === 'barcode') {
        this._addBarcodeField(x, y, fieldPlaceholder, fieldKey);
    } else {
        this._addTextField(x, y, fieldPlaceholder, fieldKey);
    }
}

export function _getCanvasJson() {
    const fabricJson = this.canvas.toJSON();

    const customMeta = this.canvas.getObjects().map((obj, i) => ({
        index:        i,
        fieldKey:     obj.fieldKey      || null,
        objectType:   obj.objectType    || null,
        barcodeValue: obj.barcodeValue  || null,
        barcodeFormat: obj.barcodeFormat || null,
        customExpression: obj.customExpression || null,
    }));

    return JSON.stringify(fabricJson);
}

export function _addTextField(x, y, placeholder, fieldKey) {
    const text = new fabric.IText(placeholder, {
        left: x, top: y,
        fontSize: 16,
        fill: '#000000',
        fontFamily: 'Arial',
    });
    text.fieldKey = fieldKey;
    this.canvas.add(text);
    this.canvas.setActiveObject(text);
    this.canvas.renderAll();
}

export function _addBarcodeField(x, y, value, fieldKey) {
    const tempCanvas = document.createElement('canvas');

    JsBarcode(tempCanvas, value, {
        format: "CODE128",
        displayValue: false,
        margin: 0
    });

    const imgEl = new Image();
    imgEl.onload = () => {
        const fabricImg = new fabric.Image(imgEl, {
            left: x,
            top: y,
        });

        fabricImg.fieldKey = fieldKey;
        fabricImg.objectType = 'barcode';
        fabricImg.barcodeValue = value;
        fabricImg.barcodeFormat = 'CODE128';

        this.canvas.add(fabricImg);
        this.canvas.setActiveObject(fabricImg);
        this.canvas.renderAll();
    };

    imgEl.src = tempCanvas.toDataURL("image/png");
}
