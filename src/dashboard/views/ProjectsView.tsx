import React, { useState } from 'react';
import { UserProfile, ProjectRecord } from '@/profile/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Plus, FolderGit2, Pencil, Trash2, ExternalLink, GitBranch, Code } from 'lucide-react';

interface ProjectsViewProps {
  profile: UserProfile;
  onSave: (updatedProfile: UserProfile) => Promise<void>;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ profile, onSave }) => {
  const [projects, setProjects] = useState<ProjectRecord[]>([...profile.projects]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProj, setEditingProj] = useState<ProjectRecord | null>(null);

  // Form State
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [techInput, setTechInput] = useState<string>('');
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [projectUrl, setProjectUrl] = useState<string>('');
  const [githubUrl, setGithubUrl] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [achievements, setAchievements] = useState<string>('');

  const openAddModal = () => {
    setEditingProj(null);
    setTitle('');
    setDescription('');
    setTechInput('');
    setTechnologies([]);
    setProjectUrl('');
    setGithubUrl('');
    setRole('');
    setAchievements('');
    setIsModalOpen(true);
  };

  const openEditModal = (proj: ProjectRecord) => {
    setEditingProj(proj);
    setTitle(proj.title);
    setDescription(proj.description);
    setTechnologies([...proj.technologies]);
    setTechInput('');
    setProjectUrl(proj.projectUrl || '');
    setGithubUrl(proj.githubUrl || '');
    setRole(proj.role || '');
    setAchievements(proj.achievements || '');
    setIsModalOpen(true);
  };

  const handleAddTech = () => {
    const val = techInput.trim();
    if (val && !technologies.includes(val)) {
      setTechnologies(prev => [...prev, val]);
      setTechInput('');
    }
  };

  const handleRemoveTech = (t: string) => {
    setTechnologies(prev => prev.filter(item => item !== t));
  };

  const handleSaveProj = async (e: React.FormEvent) => {
    e.preventDefault();

    const record: ProjectRecord = {
      id: editingProj ? editingProj.id : `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      description,
      technologies,
      projectUrl: projectUrl.trim() || undefined,
      githubUrl: githubUrl.trim() || undefined,
      role: role.trim() || undefined,
      achievements: achievements.trim() || undefined
    };

    let updated: ProjectRecord[];
    if (editingProj) {
      updated = projects.map(item => item.id === editingProj.id ? record : item);
    } else {
      updated = [record, ...projects];
    }

    setProjects(updated);
    setIsModalOpen(false);

    await onSave({
      ...profile,
      projects: updated
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this project?')) {
      const updated = projects.filter(item => item.id !== id);
      setProjects(updated);
      await onSave({
        ...profile,
        projects: updated
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Featured Projects & Portfolio</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Key software and design projects matched against job portal questionnaire requirements.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={openAddModal}
        >
          Add Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">No projects added yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Showcase your best open source or personal projects with technologies used and repository links.
          </p>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
            Add Your First Project
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((proj) => (
            <Card key={proj.id} className="hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-base">{proj.title}</h4>
                    {proj.role && <Badge variant="blue" size="sm">{proj.role}</Badge>}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>

                  {/* Tech stack */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.technologies.map((tech) => (
                      <span key={tech} className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Links */}
                  <div className="flex items-center gap-4 text-xs pt-1">
                    {proj.projectUrl && (
                      <a
                        href={proj.projectUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Live Demo
                      </a>
                    )}
                    {proj.githubUrl && (
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-slate-700 hover:underline font-medium"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        Repository
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(proj)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(proj.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProj ? 'Edit Project' : 'Add Project'}
        subtitle="Highlight technical depth, role, and achievements."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProj} className="space-y-4">
          <Input
            label="Project Title *"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Distributed Task Scheduler"
          />

          <Input
            label="Role in Project"
            optional
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Lead Developer / Creator"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Description *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the problem solved, architecture, and impact..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Technologies Used</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTech();
                  }
                }}
                placeholder="e.g. React, PostgreSQL, Docker"
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTech}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {technologies.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                  {t}
                  <button type="button" onClick={() => handleRemoveTech(t)} className="text-slate-400 hover:text-red-600">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Live Project URL"
              optional
              type="url"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              placeholder="https://myproject.com"
            />
            <Input
              label="GitHub Repository URL"
              optional
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/user/project"
            />
          </div>

          <div className="pt-4 border-t flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              {editingProj ? 'Update Project' : 'Save Project'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
