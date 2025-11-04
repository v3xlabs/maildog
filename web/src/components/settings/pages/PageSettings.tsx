import { usePages, useCreatePage, useUpdatePage, useDeletePage, useCategories } from '@/api/pages';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { DialogContent, DialogDescription, DialogRoot, DialogTitle } from '@/components/ui/Dialog';
import { useState } from 'react';
import { FiPlus, FiTrash, FiEdit } from 'react-icons/fi';

export const PageSettings = () => {
    const userId = 'default-user';
    const { data: pagesData, isLoading } = usePages(userId);
    const { data: categoriesData } = useCategories(userId);
    const createPage = useCreatePage();
    const updatePage = useUpdatePage();
    const deletePage = useDeletePage();

    const [editingPage, setEditingPage] = useState<any>(null);
    const [open, setOpen] = useState(false);
    const [newCategoryValue, setNewCategoryValue] = useState('');

    const slugify = (s: string) =>
        s
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-+)|(-+$)/g, '');

    const handleSave = () => {
        if (!editingPage) return;

        const pageSlug = slugify(editingPage.name || 'page');

        const categoryToUse = editingPage.category === '__create_new__' ? (newCategoryValue || '') : (editingPage.category || '');

        const pageToSave = {
            ...editingPage,
            slug: pageSlug,
            user_id: editingPage.user_id || userId,
            category: categoryToUse === '' ? null : categoryToUse,
            config: JSON.stringify(editingPage.config || {}),
        };

        const exists = pagesData?.pages?.some((p: any) => p.slug === editingPage.slug);
        if (exists) {
            updatePage.mutate(pageToSave, { onSuccess: () => setOpen(false) });
        } else {
            createPage.mutate(pageToSave, { onSuccess: () => setOpen(false) });
        }

        setEditingPage(null);
        setNewCategoryValue('');
    };

    const handleAddNew = () => {
        setEditingPage({
            user_id: userId,
            name: 'New Page',
            category: '',
            page_type: 'email_list',
            config: { labelfilter: [] },
        });
        setOpen(true);
    };

    if (isLoading) return <div>Loading pages...</div>;

    return (
        <div className="card space-y-2">
            <div className="px-4 py-2 border-b">
                <h2 className="text-lg font-medium">Page Settings</h2>
                <p className="text-sm text-gray-500">Manage pages and categories</p>
            </div>

            <div className="px-4">
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className="text-left">Name</th>
                            <th className="text-left">Category</th>
                            <th className="text-left">Type</th>
                            <th className="text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagesData?.pages?.map((page: any) => (
                            <tr key={page.slug} className="border-b last:border-b-0 px-2">
                                <td className="py-2">
                                    <div className="font-medium">{page.name}</div>
                                </td>
                                <td className="py-2">{page.category || '—'}</td>
                                <td className="py-2">{page.page_type}</td>
                                <td className="py-0.5">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="xs"
                                            variant="secondary"
                                            onClick={() => {
                                                setEditingPage({ ...page, config: JSON.parse(page.config) });
                                                setOpen(true);
                                            }}
                                        >
                                            <FiEdit className="w-3 h-3" />
                                        </Button>
                                        <Button
                                            size="xs"
                                            variant="destructive"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this page?')) {
                                                    deletePage.mutate({ slug: page.slug, userId: userId });
                                                }
                                            }}
                                        >
                                            <FiTrash className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(!pagesData?.pages || pagesData.pages.length === 0) && (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-gray-500">
                                    No pages configured yet. Add your first page.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end border-t p-2">
                <Button onClick={handleAddNew} size="sm">
                    <FiPlus className="mr-2" /> Add Page
                </Button>
            </div>

            <DialogRoot open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditingPage(null); }}>
                {editingPage && (
                    <DialogContent className="max-w-lg">
                        <div className="px-6 py-4 border-b">
                            <DialogTitle className="text-xl font-semibold">
                                {pagesData?.pages.some((p: any) => p.slug === editingPage.slug) ? 'Edit Page' : 'Create Page'}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-gray-600 mt-1">
                                Configure your page settings and categorization
                            </DialogDescription>
                        </div>

                        <div className="px-6 py-6 space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <Input
                                    value={editingPage.name}
                                    onChange={(e) => setEditingPage({ ...editingPage, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="Enter page name"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Category (optional)</label>
                                <Select
                                    value={editingPage.category && editingPage.category !== '' ? editingPage.category : 'none'}
                                    onValueChange={(value: string) => setEditingPage({ ...editingPage, category: value })}
                                >
                                    <SelectTrigger className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Category</SelectItem>
                                        {(categoriesData?.categories || []).map((c: string) => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                        <SelectItem value="__create_new__">+ Create new category</SelectItem>
                                    </SelectContent>
                                </Select>
                                {editingPage.category === '__create_new__' && (
                                    <div className="mt-3 space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">New Category Name</label>
                                        <Input 
                                            value={newCategoryValue} 
                                            onChange={(e) => setNewCategoryValue(e.target.value)}
                                            className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="Enter new category name"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Page Type</label>
                                <Select
                                    value={editingPage.page_type}
                                    onValueChange={(value: string) => setEditingPage({ ...editingPage, page_type: value })}
                                >
                                    <SelectTrigger className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                                        <SelectValue placeholder="Select page type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="email_list">Email List</SelectItem>
                                        <SelectItem value="calendar">Calendar</SelectItem>
                                        <SelectItem value="overview">Overview</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {editingPage.page_type === 'email_list' && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Label Filter</label>
                                    <Input
                                        value={(editingPage.config?.labelfilter || []).join(', ')}
                                        onChange={(e) => setEditingPage({ 
                                            ...editingPage, 
                                            config: { 
                                                labelfilter: e.target.value.split(',').map((s: string) => s.trim()).filter(s => s) 
                                            } 
                                        })}
                                        className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Enter labels separated by commas (e.g., important, work, urgent)"
                                    />
                                    <p className="text-xs text-gray-500">
                                        Emails with these labels will appear on this page
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                            <Button 
                                variant="ghost" 
                                onClick={() => { setOpen(false); setEditingPage(null); }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSave}
                                className="px-6 py-2 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Save Page
                            </Button>
                        </div>
                    </DialogContent>
                )}
            </DialogRoot>
        </div>
    );
};
