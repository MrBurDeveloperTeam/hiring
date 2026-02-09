import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, GraduationCap, Briefcase, Calendar, Mail, Edit } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

import { getProfile, getSeekerProfile } from '../../lib/api/profiles';
import { getEducation } from '../../lib/api/education';
import { getWorkExperience } from '../../lib/api/work_experience';
import { Database } from '../../lib/database.types';
import { Education, WorkExperience } from '../../lib/types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type SeekerProfileRow = Database['public']['Tables']['seeker_profiles']['Row'];

interface SeekerPublicProfileEmbedProps {
    userId: string;
}

export default function SeekerPublicProfileEmbed({ userId }: SeekerPublicProfileEmbedProps) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<ProfileRow | null>(null);
    const [seekerProfile, setSeekerProfile] = useState<SeekerProfileRow | null>(null);
    const [education, setEducation] = useState<Education[]>([]);
    const [experience, setExperience] = useState<WorkExperience[]>([]);

    useEffect(() => {
        async function loadData() {
            if (!userId) return;
            setLoading(true);
            try {
                const [profileData, seekerData, eduData, expData] = await Promise.all([
                    getProfile(userId),
                    getSeekerProfile(userId),
                    getEducation(userId),
                    getWorkExperience(userId)
                ]);

                setProfile(profileData);
                setSeekerProfile(seekerData);
                setEducation(eduData);
                setExperience(expData);
            } catch (error) {
                console.error('Error loading seeker profile:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <p className="text-gray-500">Loading profile preview...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex h-64 flex-col items-center justify-center text-center">
                <p className="text-gray-500">Could not load profile preview.</p>
            </div>
        );
    }

    const initials = (profile.name || profile.email || '?')
        .charAt(0)
        .toUpperCase();

    const seekerTypeLabel = seekerProfile?.seeker_type
        ? seekerProfile.seeker_type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
        : 'Job Seeker';

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="absolute top-4 right-4 z-10">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white/80 hover:bg-white border-white/50 backdrop-blur-sm shadow-sm"
                        onClick={() => navigate('/seekers/dashboard/edit')}
                        icon={<Edit className="h-4 w-4" />}
                    >
                        Edit Profile
                    </Button>
                </div>
                <div className="h-24 bg-gradient-to-r from-indigo-50 to-blue-50"></div>
                <div className="px-6 pb-6">
                    <div className="relative -mt-10 mb-4">
                        <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                            <AvatarImage src={profile.avatar_url || ''} alt={profile.name || ''} />
                            <AvatarFallback className="text-lg bg-gray-100 text-gray-600 font-bold">{initials}</AvatarFallback>
                        </Avatar>
                    </div>

                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <h2 className="text-3xl font-bold text-gray-900">{profile.name}</h2>
                            <Badge variant="info" className="w-fit text-sm py-1">{seekerTypeLabel}</Badge>
                        </div>

                        {seekerProfile?.headline && (
                            <p className="text-gray-600 mt-1 font-medium text-lg">{seekerProfile.headline}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 mt-2 text-base text-gray-500">
                            {/* Location removed as not present in new schema */}
                            {seekerProfile?.years_experience !== null && seekerProfile?.years_experience !== undefined && (
                                <div className="flex items-center gap-1">
                                    <Briefcase className="h-5 w-5" />
                                    <span>{seekerProfile.years_experience} {seekerProfile.years_experience === 1 ? 'year' : 'years'} exp</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <Mail className="h-5 w-5" />
                                <span>{profile.email}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* About Section */}
                    {seekerProfile?.bio && (
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">About</h3>
                            <p className="text-gray-600 whitespace-pre-wrap text-base leading-relaxed">
                                {seekerProfile.bio}
                            </p>
                        </div>
                    )}

                    {/* Work Experience */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-gray-400" />
                            Work Experience
                        </h3>
                        {experience.length > 0 ? (
                            <div className="space-y-6">
                                {experience.map((exp) => (
                                    <div key={exp.id} className="relative pl-6 border-l-2 border-gray-100 pb-2">
                                        <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-gray-200 ring-4 ring-white"></div>
                                        <div className="mb-1">
                                            <h4 className="text-lg font-semibold text-gray-900">{exp.jobTitle}</h4>
                                            <div className="text-base text-gray-600 font-medium">{exp.companyName}</div>
                                        </div>
                                        <div className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
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
                                            <p className="text-base text-gray-600 mt-1">{exp.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic text-sm">No work experience listed.</p>
                        )}
                    </div>

                    {/* Education */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-gray-400" />
                            Education
                        </h3>
                        {education.length > 0 ? (
                            <div className="space-y-6">
                                {education.map((edu) => (
                                    <div key={edu.id} className="relative pl-6 border-l-2 border-gray-100">
                                        <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-gray-200 ring-4 ring-white"></div>
                                        <div className="mb-1">
                                            <h4 className="text-lg font-semibold text-gray-900">{edu.institutionName}</h4>
                                            <div className="text-base text-gray-600 font-medium">{edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}</div>
                                        </div>
                                        <div className="text-sm text-gray-500">
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
                <div className="space-y-6">
                    {/* Skills / Clinical Exposure */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Clinical Exposure</h3>
                        {seekerProfile?.clinical_exposures && Array.isArray(seekerProfile.clinical_exposures) && seekerProfile.clinical_exposures.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {seekerProfile.clinical_exposures.map((skill: string) => (
                                    <Badge key={skill} variant="info" className="font-medium text-sm py-1">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic text-sm">No clinical exposures listed.</p>
                        )}
                    </div>

                    {/* At a Glance */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">At a Glance</h3>
                        <div className="space-y-3 text-base">
                            <div className="flex justify-between py-1.5 border-b border-gray-50">
                                <span className="text-gray-500">Education Level</span>
                                <span className="font-medium text-gray-900">{seekerProfile?.education_level || '-'}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-gray-50">
                                <span className="text-gray-500">Graduation</span>
                                <span className="font-medium text-gray-900">{seekerProfile?.expected_graduation_date || '-'}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-gray-50">
                                <span className="text-gray-500">License Status</span>
                                <span className="font-medium text-gray-900">{seekerProfile?.license_status || '-'}</span>
                            </div>
                            <div className="flex justify-between py-1.5">
                                <span className="text-gray-500">Joined</span>
                                <span className="font-medium text-gray-900">{new Date(profile.created_at).getFullYear()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
