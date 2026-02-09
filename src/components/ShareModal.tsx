import { useState } from 'react';
import { Modal } from './ui/modal';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Check, Copy, Mail, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface ShareModalProps {
    open: boolean;
    onClose: () => void;
    url: string;
    title: string;
}

export function ShareModal({ open, onClose, url, title }: ShareModalProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareToWhatsApp = () => {
        const text = encodeURIComponent(`Check out this job: ${title} ${url}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const shareToEmail = () => {
        const subject = encodeURIComponent(`Job Opportunity: ${title}`);
        const body = encodeURIComponent(`Hi,\n\nI found this job opportunity and thought you might be interested:\n\n${title}\n${url}\n\nBest regards`);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    };

    return (
        <Modal open={open} onClose={onClose} title="Share Job" maxWidth="max-w-md">
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Copy link</label>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input value={url} readOnly className="pr-12" />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopy}
                            className={cn("shrink-0 transition-colors px-3", copied && "text-green-600 border-green-200 bg-green-50")}
                            title="Copy to clipboard"
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Share via</label>
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="h-12 hover:bg-[#25D366]/10 hover:text-[#25D366] hover:border-[#25D366]"
                            onClick={shareToWhatsApp}
                            icon={<MessageCircle className="h-5 w-5" />}
                        >
                            WhatsApp
                        </Button>
                        <Button
                            variant="outline"
                            className="h-12 hover:bg-brand/10 hover:text-brand hover:border-brand"
                            onClick={shareToEmail}
                            icon={<Mail className="h-5 w-5" />}
                        >
                            Email
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
