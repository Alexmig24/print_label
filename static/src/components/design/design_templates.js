/** @odoo-module **/

export async function loadTemplates() {
    try {
        const templates = await this.orm.call('ome.print.label', 'get_templates', []);
        this.state.templates = templates;
    } catch (e) {
        console.error('loadTemplates error', e);
    }
}

export function toggleTemplateMenu() {
    this.state.showTemplateMenu = !this.state.showTemplateMenu;
}

export async function saveAsNewTemplate() {
    const name = prompt('Nombre de la plantilla:');
    if (!name || !name.trim()) return;

    this.state.savingTemplate = true;
    try {
        const json = this._getCanvasJson();
        const result = await this.orm.call('ome.print.label', 'save_template', [name.trim(), json]);
        this.state.currentTemplateId = result.id;
        this.state.currentTemplateName = result.name;
        await this.loadTemplates();
        this.notification.add('Plantilla guardada', { type: 'success' });
    } catch (e) {
        console.error('saveAsNewTemplate error', e);
        this.notification.add('Error al guardar plantilla', { type: 'danger' });
    } finally {
        this.state.savingTemplate = false;
    }
}

export async function updateCurrentTemplate() {
    if (!this.state.currentTemplateId) {
        return this.saveAsNewTemplate();
    }

    this.state.savingTemplate = true;
    try {
        await this.orm.call('ome.print.label', 'update_template', [
            this.state.currentTemplateId,
            { json_data: this._getCanvasJson() },
        ]);
        this.notification.add('Plantilla actualizada', { type: 'success' });
    } catch (e) {
        console.error('updateCurrentTemplate error', e);
        this.notification.add('Error al actualizar plantilla', { type: 'danger' });
    } finally {
        this.state.savingTemplate = false;
    }
}
