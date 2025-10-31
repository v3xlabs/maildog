import { usePages, useCreatePage, useUpdatePage, useDeletePage } from '@/api/pages';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useState } from 'react';
import { FiPlus, FiTrash } from 'react-icons/fi';

export const PageSettings = () => {
    const userId = 'default-user'; // Replace with actual user ID from auth
    const { data: pagesData, isLoading } = usePages(userId);
    const createPage = useCreatePage();
    const updatePage = useUpdatePage();
    const deletePage = useDeletePage();

    const [editingPage, setEditingPage] = useState<any>(null);

    const handleSave = () => {
        if (editingPage) {
            const pageSlug = editingPage.slug || editingPage.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim('-');
            
            const pageToSave = {
                ...editingPage,
                slug: pageSlug,
                config: JSON.stringify(editingPage.config),
            };
            if (pagesData?.pages.some(p => p.slug === editingPage.slug)) {
                updatePage.mutate(pageToSave);
            } else {
                createPage.mutate(pageToSave);
            }
            setEditingPage(null);
        }
    };

    const handleAddNew = () => {
        setEditingPage({
            user_id: userId,
            name: 'New Page',
            category: '',
            page_type: 'email_list',
            config: { labelfilter: [] },
            position: (pagesData?.pages.length || 0) + 1,
        });
    };

    const handleConfigChange = (pageSlug: string, newConfig: any) => {
        if (editingPage?.slug === pageSlug) {
            setEditingPage({ ...editingPage, config: newConfig });
        }
    };

    if (isLoading) {
        return <div>Loading pages...</div>;
    }

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Page Settings</h2>
                <Button onClick={handleAddNew} size="sm" variant="ghost">
                    <FiPlus /> Add New
                </Button>
            </div>
            <div className="card-content space-y-4">
                {pagesData?.pages.map(page => (
                    <div key={page.slug} className="flex items-center justify-between p-2 rounded-lg bg-background">
                        <div>{page.name}</div>
                        <div className="flex items-center gap-2">
                            <Button onClick={() => setEditingPage({...page, config: JSON.parse(page.config)})}>Edit</Button>
                            <Button onClick={() => deletePage.mutate({ slug: page.slug!, userId })} variant="destructive" size="sm">
                                <FiTrash />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {editingPage && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-card p-6 rounded-lg w-full max-w-md space-y-4">
                        <h3 className="text-lg font-semibold">{pagesData?.pages.some(p => p.slug === editingPage.slug) ? 'Edit Page' : 'Create Page'}</h3>
                        
                        <Input
                            label="Name"
                            value={editingPage.name}
                            onChange={(e) => setEditingPage({ ...editingPage, name: e.target.value })}
                        />

                        <Input
                            label="Slug (URL path)"
                            value={editingPage.slug || editingPage.name?.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim('-') || ''}
                            onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                            placeholder="e.g. my-page-name"
                        />

                        <Select
                            value={editingPage.category && editingPage.category !== '' ? editingPage.category : 'none'}
                            onValueChange={(value: string) => setEditingPage({ ...editingPage, category: value === 'none' ? '' : value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Category (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Category</SelectItem>
                                <SelectItem value="News & Updates">News & Updates</SelectItem>
                                <SelectItem value="Authentication">Authentication</SelectItem>
                                <SelectItem value="Spending & Going">Spending & Going</SelectItem>
                                <SelectItem value="Calendar">Calendar</SelectItem>
                                <SelectItem value="Untrusted">Untrusted</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={editingPage.page_type}
                            onValueChange={(value: string) => setEditingPage({ ...editingPage, page_type: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Page Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="email_list">Email List</SelectItem>
                                <SelectItem value="calendar">Calendar</SelectItem>
                                <SelectItem value="overview">Overview</SelectItem>
                            </SelectContent>
                        </Select>

                        {editingPage.page_type === 'email_list' && (
                            <Input
                                label="Label Filter (comma-separated)"
                                value={editingPage.config.labelfilter.join(',')}
                                onChange={(e) => handleConfigChange(editingPage.slug, { labelfilter: e.target.value.split(',').map(s => s.trim()) })}
                            />
                        )}

                        <div className="flex justify-end gap-2">
                            <Button onClick={() => setEditingPage(null)} variant="ghost">Cancel</Button>
                            <Button onClick={handleSave}>Save</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
