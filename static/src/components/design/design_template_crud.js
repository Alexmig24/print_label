/** @odoo-module **/

export async function onLoadTemplate(templateId) {
    try {
        const result = await this.orm.call('ome.print.label', 'load_template', [templateId]);
        if (!result) return;

        this.canvas.loadFromJSON(JSON.parse(result.json_data)).then((canvas)=>{
            canvas.renderAll()
        })
        this.state.currentTemplateId   = result.id;
        this.state.currentTemplateName = result.name;
        this.state.showTemplateMenu    = false;
        this.notification.add(`Plantilla "${result.name}" cargada`, { type: 'info' });

    } catch (e) {
        console.error('onLoadTemplate error', e);
        this.notification.add('Error al cargar plantilla', { type: 'danger' });
    }
}

export async function onDeleteTemplate(templateId) {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    try {
        await this.orm.call('ome.print.label', 'delete_template', [templateId]);
        if (this.state.currentTemplateId === templateId) {
            this.state.currentTemplateId = null;
            this.state.currentTemplateName = '';
        }
        await this.loadTemplates();
        this.notification.add('Plantilla eliminada', { type: 'warning' });
    } catch (e) {
        console.error('onDeleteTemplate error', e);
        this.notification.add('Error al eliminar plantilla', { type: 'danger' });
    }
}

export async function onRenameTemplate(templateId) {
    const tpl = this.state.templates.find(t => t.id === templateId);
    const newName = prompt('Nuevo nombre:', tpl ? tpl.name : '');
    if (!newName || !newName.trim()) return;
    try {
        await this.orm.call('ome.print.label', 'update_template', [templateId, { name: newName.trim() }]);
        if (this.state.currentTemplateId === templateId) {
            this.state.currentTemplateName = newName.trim();
        }
        await this.loadTemplates();
        this.notification.add('Plantilla renombrada', { type: 'success' });
    } catch (e) {
        console.error('onRenameTemplate error', e);
    }
}

export function newTemplate() {
    this.canvas.clear();
    this.canvas.backgroundColor = '#ffffff';
    this.canvas.renderAll();
    this.state.currentTemplateId = null;
    this.state.currentTemplateName = '';
    this.state.showTemplateMenu = false;
}
