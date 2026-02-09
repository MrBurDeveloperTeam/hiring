import { useState, useEffect } from 'react';
import { Education } from '../../lib/types';
import { getEducation, addEducation, updateEducation, deleteEducation } from '../../lib/api/education';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Modal } from '../ui/modal';
import { Checkbox } from '../ui/checkbox';
import { Trash2, Pencil, Plus } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { Toast } from '../ui/toast';

interface EducationSectionProps {
    userId: string;
    initialData?: Education[];
}

export default function EducationSection({ userId, initialData = [] }: EducationSectionProps) {
    const [educationList, setEducationList] = useState<Education[]>(initialData);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Education>>({
        institutionName: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: ''
    });

    // Toast State
    const [toast, setToast] = useState<{ open: boolean; title: string; variant: 'success' | 'error' | 'warning' | 'info' }>({
        open: false,
        title: '',
        variant: 'success'
    });

    useEffect(() => {
        fetchEducation();
    }, [userId]);

    // Sync initialData if provided (e.g. from parent after resume scan)
    useEffect(() => {
        if (initialData.length > 0) {
            setEducationList(prev => {
                const newItems = initialData.filter(newItem =>
                    !prev.some(existing => existing.institutionName === newItem.institutionName && existing.degree === newItem.degree)
                );
                return [...prev, ...newItems];
            });
        }
    }, [initialData]);

    async function fetchEducation() {
        setLoading(true);
        try {
            const data = await getEducation(userId);
            setEducationList(prev => {
                const tempItems = prev.filter(item => item.id.startsWith('temp-'));
                return [...data, ...tempItems];
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const showToast = (title: string, variant: 'success' | 'error' | 'warning' = 'success') => {
        setToast({ open: true, title, variant });
    };

    const handleOpenAdd = () => {
        setEditingId(null);
        setFormData({
            institutionName: '',
            degree: '',
            fieldOfStudy: '',
            startDate: '',
            endDate: '',
            isCurrent: false,
            description: ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (edu: Education) => {
        setEditingId(edu.id);
        setFormData({
            institutionName: edu.institutionName,
            degree: edu.degree || '',
            fieldOfStudy: edu.fieldOfStudy || '',
            startDate: edu.startDate || '',
            endDate: edu.endDate || '',
            isCurrent: edu.isCurrent || false,
            description: edu.description || ''
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.institutionName) {
            showToast('Institution Name is required', 'warning');
            return;
        }

        try {
            if (editingId && !editingId.startsWith('temp-')) {
                await updateEducation(editingId, formData);
                showToast('Education updated successfully');
            } else {
                await addEducation(userId, formData as Omit<Education, 'id'>);
                if (editingId && editingId.startsWith('temp-')) {
                    setEducationList(prev => prev.filter(p => p.id !== editingId));
                }
                showToast('Education added successfully');
            }
            setIsModalOpen(false);
            fetchEducation();
        } catch (err) {
            console.error(err);
            showToast('Failed to save education', 'error');
        }
    };

    const handleDelete = (id: string) => {
        setDeleteConfirmationId(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmationId) return;

        try {
            if (deleteConfirmationId.startsWith('temp-')) {
                setEducationList(prev => prev.filter(item => item.id !== deleteConfirmationId));
            } else {
                await deleteEducation(deleteConfirmationId);
                fetchEducation();
            }
            showToast('Education deleted successfully');
        } catch (err) {
            console.error(err);
            showToast('Failed to delete education', 'error');
        } finally {
            setDeleteConfirmationId(null);
        }
    };

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Education</h3>
                <Button variant="outline" size="sm" onClick={handleOpenAdd} icon={<Plus className="h-4 w-4" />}>
                    Add Education
                </Button>
            </div>

            <div className="space-y-4">
                {educationList.length === 0 && (
                    <p className="text-sm text-gray-500">No education added yet.</p>
                )}
                {educationList.map((edu) => (
                    <div key={edu.id} className="relative flex flex-col gap-1 border-l-2 border-gray-200 pl-4 py-1">
                        <h4 className="text-lg font-semibold text-gray-900">{edu.institutionName}</h4>
                        <p className="text-base text-gray-700">
                            {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                        </p>
                        <p className="text-sm text-gray-500">
                            {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate)}
                        </p>
                        {edu.description && <p className="text-sm text-gray-600 mt-1">{edu.description}</p>}

                        <div className="absolute right-0 top-0 flex gap-2">
                            <button onClick={() => handleOpenEdit(edu)} className="text-gray-400 hover:text-brand">
                                <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(edu.id)} className="text-gray-400 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'Edit Education' : 'Add Education'}
                maxWidth="max-w-lg"
            >
                <div className="space-y-4">
                    <Input
                        label="Institution Name"
                        value={formData.institutionName}
                        onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                        placeholder="e.g. University of Malaya"
                        containerClassName="text-base"
                        className="text-base px-4 py-3"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Degree"
                            value={formData.degree}
                            onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                            placeholder="e.g. Bachelor of Dental Surgery"
                            containerClassName="text-base"
                            className="text-base px-4 py-3"
                        />
                        <Input
                            label="Field of Study"
                            value={formData.fieldOfStudy}
                            onChange={(e) => setFormData({ ...formData, fieldOfStudy: e.target.value })}
                            placeholder="e.g. Dentistry"
                            containerClassName="text-base"
                            className="text-base px-4 py-3"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Start Date"
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            containerClassName="text-base"
                            className="text-base px-4 py-3"
                        />
                        <Input
                            label="End Date"
                            type="date"
                            value={formData.endDate}
                            disabled={formData.isCurrent}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            containerClassName="text-base"
                            className="text-base px-4 py-3"
                        />
                    </div>
                    <Checkbox
                        label="I am currently studying here"
                        checked={formData.isCurrent}
                        onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked, endDate: e.target.checked ? '' : formData.endDate })}
                        textClassName="text-base"
                    />
                    <Input
                        label="Description (Optional)"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Activities, honors, etc."
                        containerClassName="text-base"
                        className="text-base px-4 py-3"
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSave}>Save</Button>
                    </div>
                </div>
            </Modal>

            <Modal
                open={!!deleteConfirmationId}
                onClose={() => setDeleteConfirmationId(null)}
                title="Delete Education"
                maxWidth="max-w-md"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">Are you sure you want to delete this education entry? This action cannot be undone.</p>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setDeleteConfirmationId(null)}>Cancel</Button>
                        <Button className='bg-red-600 hover:bg-red-700 text-white' onClick={confirmDelete}>Delete</Button>
                    </div>
                </div>
            </Modal>

            <Toast
                open={toast.open}
                onClose={() => setToast(prev => ({ ...prev, open: false }))}
                title={toast.title}
                variant={toast.variant}
            />
        </div>
    );
}
