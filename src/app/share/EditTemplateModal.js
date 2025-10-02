import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const EditTemplateModal = ({ isOpen, onClose, template, onTemplateChange, onSaveTemplate }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Template</DialogTitle>
                    <DialogDescription>
                        Gunakan placeholder <code>{'{{' + 'nama_tamu' + '}}'}</code> untuk nama tamu dan <code>{'{{' + 'link' + '}}'}</code> untuk link undangan.
                    </DialogDescription>
                </DialogHeader>
                <Textarea
                    value={template}
                    className="h-60"
                    onChange={onTemplateChange}
                />
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={onSaveTemplate}>Save Template</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditTemplateModal;