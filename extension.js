import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import Pango from 'gi://Pango';
import St from 'gi://St';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

const MAX_CHARS = 200;
const MAX_ENTRIES = 30;

export default class QuickTextExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._entries = this._loadEntries();
        this._signalIds = [];

        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);

        const iconFile = this.dir.get_child('quicktext-symbolic.svg');
        const gicon = new Gio.FileIcon({file: iconFile});
        const panelIcon = new St.Icon({
            gicon,
            style_class: 'system-status-icon',
        });
        this._indicator.add_child(panelIcon);

        const menuSection = new PopupMenu.PopupMenuSection();
        const rootBox = new St.BoxLayout({
            orientation: Clutter.Orientation.VERTICAL,
            style_class: 'snippet-vault-box',
        });

        const inputRow = new St.BoxLayout({
            orientation: Clutter.Orientation.HORIZONTAL,
            style_class: 'snippet-vault-input-row',
        });

        this._inputEntry = new St.Entry({
            hint_text: 'New snippet (max 200 chars)...',
            can_focus: true,
            x_expand: true,
            style_class: 'snippet-vault-entry',
        });
        this._inputEntry.clutter_text.set_max_length(MAX_CHARS);

        this._addButton = new St.Button({
            label: 'Add',
            style_class: 'button snippet-vault-btn',
            can_focus: true,
        });

        this._counterLabel = new St.Label({
            text: `0 / ${MAX_CHARS}  •  0 / ${MAX_ENTRIES} entries`,
            style_class: 'snippet-vault-counter',
            x_align: Clutter.ActorAlign.END,
        });

        const updateCounter = () => {
            const len = (this._inputEntry.get_text() ?? '').length;
            const atLimit = this._entries.length >= MAX_ENTRIES;
            this._addButton.set_reactive(!atLimit);
            this._counterLabel.set_text(
                atLimit
                    ? `${len} / ${MAX_CHARS}  •  Max ${MAX_ENTRIES} entries reached`
                    : `${len} / ${MAX_CHARS}  •  ${this._entries.length} / ${MAX_ENTRIES} entries`
            );
        };

        const textChangedId = this._inputEntry.clutter_text.connect('text-changed', () => {
            const currentText = this._inputEntry.get_text() ?? '';
            if (currentText.length > MAX_CHARS) {
                this._inputEntry.set_text(currentText.slice(0, MAX_CHARS));
            }
            updateCounter();
        });
        this._signalIds.push({obj: this._inputEntry.clutter_text, id: textChangedId});

        const addHandler = () => {
            if (this._entries.length >= MAX_ENTRIES) {
                updateCounter();
                return;
            }

            const raw = (this._inputEntry.get_text() ?? '').trim();
            if (!raw)
                return;

            const snippet = raw.slice(0, MAX_CHARS);
            this._entries.unshift(snippet);
            this._entries = this._entries.slice(0, MAX_ENTRIES);
            this._saveEntries();
            this._inputEntry.set_text('');
            updateCounter();
            this._rebuildList();
        };

        const addClickId = this._addButton.connect('clicked', addHandler);
        this._signalIds.push({obj: this._addButton, id: addClickId});

        const activateId = this._inputEntry.clutter_text.connect('activate', addHandler);
        this._signalIds.push({obj: this._inputEntry.clutter_text, id: activateId});

        inputRow.add_child(this._inputEntry);
        inputRow.add_child(this._addButton);

        rootBox.add_child(inputRow);
        rootBox.add_child(this._counterLabel);

        this._scrollView = new St.ScrollView({
            style_class: 'snippet-vault-scroll',
            hscrollbar_policy: St.PolicyType.NEVER,
            vscrollbar_policy: St.PolicyType.AUTOMATIC,
        });

        this._listBox = new St.BoxLayout({
            orientation: Clutter.Orientation.VERTICAL,
            style_class: 'snippet-vault-list',
        });

        this._scrollView.set_child(this._listBox);
        rootBox.add_child(this._scrollView);

        menuSection.box.add_child(rootBox);
        this._indicator.menu.addMenuItem(menuSection);

        Main.panel.addToStatusArea(this.uuid, this._indicator);
        updateCounter();
        this._rebuildList();
    }

    _rebuildList() {
        this._listBox.destroy_all_children();

        const atLimit = this._entries.length >= MAX_ENTRIES;
        this._addButton?.set_reactive(!atLimit);

        if (this._entries.length === 0) {
            const emptyLabel = new St.Label({
                text: 'No saved entries yet.',
                style_class: 'snippet-vault-empty',
            });
            this._listBox.add_child(emptyLabel);
            return;
        }

        this._entries.forEach((entryText, index) => {
            const row = new St.BoxLayout({
                orientation: Clutter.Orientation.HORIZONTAL,
                style_class: 'snippet-vault-row',
            });

            const label = new St.Label({
                text: entryText,
                x_expand: true,
                y_align: Clutter.ActorAlign.CENTER,
                style_class: 'snippet-vault-text',
            });
            label.clutter_text.set_line_wrap(true);
            label.clutter_text.set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);

            const copyBtn = new St.Button({
                label: 'Copy',
                style_class: 'button snippet-vault-btn',
                can_focus: true,
                y_align: Clutter.ActorAlign.CENTER,
            });
            copyBtn.connect('clicked', () => {
                // Only writes to the clipboard when the user explicitly clicks Copy.
                const clipboard = St.Clipboard.get_default();
                clipboard.set_text(St.ClipboardType.CLIPBOARD, entryText);
            });

            const deleteBtn = new St.Button({
                label: 'Delete',
                style_class: 'button snippet-vault-btn',
                can_focus: true,
                y_align: Clutter.ActorAlign.CENTER,
            });
            deleteBtn.connect('clicked', () => {
                this._entries.splice(index, 1);
                this._saveEntries();
                const len = (this._inputEntry?.get_text() ?? '').length;
                this._counterLabel?.set_text(`${len} / ${MAX_CHARS}  •  ${this._entries.length} / ${MAX_ENTRIES} entries`);
                this._rebuildList();
            });

            row.add_child(label);
            row.add_child(copyBtn);
            row.add_child(deleteBtn);
            this._listBox.add_child(row);
        });
    }

    _loadEntries() {
        try {
            const raw = this._settings.get_string('entries');
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed))
                return [];
            return parsed
                .filter(item => typeof item === 'string')
                .map(item => item.slice(0, MAX_CHARS))
                .slice(0, MAX_ENTRIES);
        } catch {
            return [];
        }
    }

    _saveEntries() {
        this._entries = (this._entries ?? []).slice(0, MAX_ENTRIES);
        this._settings.set_string('entries', JSON.stringify(this._entries));
    }

    disable() {
        for (const {obj, id} of this._signalIds ?? []) {
            obj.disconnect(id);
        }
        this._signalIds = [];

        this._inputEntry?.destroy();
        this._inputEntry = null;

        this._addButton?.destroy();
        this._addButton = null;

        this._counterLabel?.destroy();
        this._counterLabel = null;

        this._listBox?.destroy();
        this._listBox = null;

        this._scrollView?.destroy();
        this._scrollView = null;

        this._indicator?.destroy();
        this._indicator = null;

        this._entries = null;
        this._settings = null;
    }
}