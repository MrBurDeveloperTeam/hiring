import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppShell } from '../../layouts/AppShell';
import { MapPin, Building2, GraduationCap, Briefcase, User, Calendar, Mail, Edit } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useAuth } from '../../contexts/AuthContext';

import { getProfile, getSeekerProfile } from '../../lib/api/profiles';
import { getEducation } from '../../lib/api/education';
import { getWorkExperience } from '../../lib/api/work_experience';
import { Database } from '../../lib/database.types';
import { Education, WorkExperience } from '../../lib/types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type SeekerProfileRow = Database['public']['Tables']['seeker_profiles']['Row'];

export default function SeekerPublicProfile() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [profile, setProfile] = useState<ProfileRow | null>(null);
    const [seekerProfile, setSeekerProfile] = useState<SeekerProfileRow | null>(null);
    const [education, setEducation] = useState<Education[]>([]);
    const [experience, setExperience] = useState<WorkExperience[]>([]);

    useEffect(() => {
        async function loadData() {
            if (!id) return;
            setLoading(true);
            try {
                // Fetch all data in parallel
                const [profileData, seekerData, eduData, expData] = await Promise.all([
                    getProfile(id),
                    getSeekerProfile(id),
                    getEducation(id),
                    getWorkExperience(id)
                ]);

                if (!profileData) {
                    setNotFound(true);
                } else {
                    setProfile(profileData);
                    setSeekerProfile(seekerData);
                    setEducation(eduData);
                    setExperience(expData);
                }
            } catch (error) {
                console.error('Error loading seeker profile:', error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id]);

    if (loading) {
        return (
            <AppShell background="muted">
                <div className="flex h-96 items-center justify-center">
                    <p className="text-gray-500">Loading profile...</p>
                </div>
            </AppShell>
        );
    }

    if (notFound || !profile) {
        return (
            <AppShell background="muted">
                <div className="flex h-96 flex-col items-center justify-center text-center">
                    <User className="h-12 w-12 text-gray-300 mb-4" />
                    <h2 className="text-xl font-bold text-gray-900">Profile not found</h2>
                    <p className="text-gray-500 mt-2">We couldn't find a seeker with that ID.</p>
                    <Button variant="outline" className="mt-4" asChild>
                        <Link to="/">Go Home</Link>
                    </Button>
                </div>
            </AppShell>
        );
    }

    const canEdit = user && user.id === id;

    const initials = (profile.name || profile.email || '?')
        .charAt(0)
        .toUpperCase();

    const seekerTypeLabel = seekerProfile?.seeker_type
        ? seekerProfile.seeker_type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
        : 'Job Seeker';

    return (
        <AppShell background="muted" padded>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Card */}
                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                    <div className="h-32 bg-gradient-to-r from-indigo-50 to-blue-50 relative"></div>
                    <div className="px-8 pb-8">
                        <div className="relative -mt-12 mb-4 flex justify-between items-end">
                            <Avatar className="h-28 w-28 border-4 border-white shadow-md">
                                <AvatarImage src={profile.avatar_url || ''} alt={profile.name || ''} />
                                <AvatarFallback className="text-2xl bg-gray-100 text-gray-600 font-bold">{initials}</AvatarFallback>
                            </Avatar>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                {canEdit && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-2 bg-white"
                                        icon={<Edit className="h-4 w-4" />}
                                        asChild
                                    >
                                        <Link to="/seekers/dashboard">
                                            Edit Profile
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="flex flex-col md:flex-row md:items-center gap-2">
                                <h1 className="text-4xl font-bold text-gray-900">{profile.name}</h1>
                                <Badge variant="info" className="w-fit">{seekerTypeLabel}</Badge>
                            </div>

                            {seekerProfile?.headline && (
                                <p className="text-xl text-gray-600 mt-2 font-medium">{seekerProfile.headline}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-5 mt-4 text-base text-gray-500">
                                {/* Location removed */}
                                {seekerProfile?.years_experience !== null && seekerProfile?.years_experience !== undefined && (
                                    <div className="flex items-center gap-1">
                                        <Briefcase className="h-4 w-4" />
                                        <span>{seekerProfile.years_experience} {seekerProfile.years_experience === 1 ? 'year' : 'years'} exp</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <Mail className="h-4 w-4" />
                                    <span>{profile.email}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* About Section */}
                        {seekerProfile?.bio && (
                            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">About</h3>
                                <p className="text-base text-gray-600 whitespace-pre-wrap leading-relaxed">
                                    {seekerProfile.bio}
                                </p>
                            </div>
                        )}

                        {/* Work Experience */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-gray-400" />
                                Work Experience
                            </h3>
                            {experience.length > 0 ? (
                                <div className="space-y-6">
                                    {experience.map((exp, index) => (
                                        <div key={exp.id} className="relative pl-4 border-l-2 border-gray-100 last:border-0 pb-1">
                                            <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-gray-200 ring-4 ring-white"></div>
                                            <div className="mb-1">
                                                <h4 className="text-lg font-semibold text-gray-900">{exp.jobTitle}</h4>
                                                <div className="text-base text-gray-500 font-medium">{exp.companyName}</div>
                                            </div>
                                            <div className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>
                                                    {new Date(exp.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                                                    {' - '}
                                                    {exp.isCurrent
                                                        ? 'Present'
                                                        : exp.endDate
                                                            ? new Date(exp.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
                                                            : ''
                                                    }
                                                </span>
                                                {exp.location && <span>• {exp.location}</span>}
                                            </div>
                                            {exp.description && (
                                                <p className="text-base text-gray-600 mt-2">{exp.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic text-sm">No work experience listed.</p>
                            )}
                        </div>

                        {/* Education */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <GraduationCap className="h-5 w-5 text-gray-400" />
                                Education
                            </h3>
                            {education.length > 0 ? (
                                <div className="space-y-6">
                                    {education.map((edu) => (
                                        <div key={edu.id} className="relative pl-4 border-l-2 border-gray-100 last:border-0">
                                            <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-gray-200 ring-4 ring-white"></div>
                                            <div className="mb-1">
                                                <h4 className="text-lg font-semibold text-gray-900">{edu.institutionName}</h4>
                                                <div className="text-base text-gray-500 font-medium">{edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}</div>
                                            </div>
                                            <div className="text-sm text-gray-400 mb-2">
                                                {new Date(edu.startDate).getFullYear()} - {edu.isCurrent ? 'Present' : new Date(edu.endDate).getFullYear()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic text-sm">No education listed.</p>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* Skills / Clinical Exposure */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Clinical Exposure</h3>
                            {seekerProfile?.clinical_exposures && Array.isArray(seekerProfile.clinical_exposures) && seekerProfile.clinical_exposures.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {seekerProfile.clinical_exposures.map((skill: string) => (
                                        <Badge key={skill} variant="info" className="font-normal">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic text-sm">No clinical exposures listed.</p>
                            )}
                        </div>

                        {/* Additional Info / At a Glance */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 mb-5 uppercase tracking-wider">At a Glance</h3>
                            <div className="space-y-3 text-base">
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-500">Education Level</span>
                                    <span className="font-medium text-gray-900">{seekerProfile?.education_level || '-'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-500">Graduation</span>
                                    <span className="font-medium text-gray-900">{seekerProfile?.expected_graduation_date || '-'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-500">License Status</span>
                                    <span className="font-medium text-gray-900">{seekerProfile?.license_status || '-'}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-gray-500">Joined</span>
                                    <span className="font-medium text-gray-900">{new Date(profile.created_at).getFullYear()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
