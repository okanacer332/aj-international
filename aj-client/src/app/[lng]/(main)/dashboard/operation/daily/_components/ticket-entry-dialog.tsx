"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { Ticket, Plus } from "lucide-react";

interface Props {
    tableId: string;
    tableName: string;
    onSuccess: () => void;
}

export function TicketEntryDialog({ tableId, tableName, onSuccess }: Props) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");

    const handleSave = async () => {
        if (!amount) return;
        try {
            await apiFetchAuth("/api/operation/ticket", {
                method: "POST",
                body: JSON.stringify({ tableId, amountKg: parseFloat(amount) })
            });
            toast.success("Fiş işlendi.");
            setOpen(false);
            setAmount("");
            onSuccess();
        } catch (e) {
            toast.error("Hata oluştu.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="w-full">
                    <Ticket className="mr-2 h-4 w-4"/> Fiş Ekle
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader><DialogTitle>{tableName} - Fiş Girişi</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Fiş Miktarı (KG)</Label>
                        <Input 
                            type="number" 
                            placeholder="Örn: 1120" 
                            className="text-lg font-bold" 
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <Button className="w-full" onClick={handleSave}>Kaydet</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}