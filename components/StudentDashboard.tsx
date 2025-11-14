import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Users,
  Clock,
  Target,
  TrendingUp,
  PlayCircle,
  Calendar,
  MessageSquare,
  Star,
  Heart,
  User,
  Brain,
  GraduationCap,
  ArrowRight,
} from "lucide-react";

interface StudentDashboardProps {
  user: {
    email: string;
    type: string;
    loginTime: number;
  };
  onStartSession: () => void;
  onManagePersonas: () => void;
  onBackToHome: () => void;
}

interface SessionStats {
  totalSessions: number;
  totalTime: number;
  averageRapport: number;
  averageEngagement: number;
  completedPersonas: number;
  currentStreak: number;
  weeklyGoal: number;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  onStartSession,
  onManagePersonas,
  onBackToHome,
}) => {
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 12,
    totalTime: 480, // minutes
    averageRapport: 4.2,
    averageEngagement: 3.8,
    completedPersonas: 3,
    currentStreak: 5,
    weeklyGoal: 3,
  });

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-black/60 backdrop-blur-xl text-white">
      {/* Header Navigation */}
      <div className="border-b border-white/10 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBackToHome}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity group"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:shadow-purple-500/25 transition-all">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Vesh</span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user.email}</p>
                <p className="text-xs text-gray-400 capitalize">{user.type}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto w-full space-y-8">
          {/* Welcome Header */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {getGreeting()}, {user.email.split("@")[0]}!
            </h1>
            <p className="text-base text-gray-400">
              Ready to practice your therapy skills? Let's continue your learning journey.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onStartSession}
              className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2.5 hover:bg-white/10 hover:border-white/20 transition-all duration-200 flex items-center space-x-2"
            >
              <PlayCircle className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Start Session</span>
            </button>

            <button
              onClick={onManagePersonas}
              className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2.5 hover:bg-white/10 hover:border-white/20 transition-all duration-200 flex items-center space-x-2"
            >
              <Users className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Manage Personas</span>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Sessions</p>
                <BookOpen className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Time</p>
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-white">{formatTime(stats.totalTime)}</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Rapport</p>
                <Heart className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.averageRapport}</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Engagement</p>
                <Target className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.averageEngagement}</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Streak</p>
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.currentStreak}</p>
            </div>
          </div>

          {/* Bottom Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Progress */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-gray-400" />
                  Weekly Progress
                </h3>
              </div>
              <div className="space-y-3">
                {[
                  { day: "Mon", sessions: 1 },
                  { day: "Tue", sessions: 0 },
                  { day: "Wed", sessions: 1 },
                  { day: "Thu", sessions: 1 },
                  { day: "Fri", sessions: 0 },
                  { day: "Sat", sessions: 1 },
                  { day: "Sun", sessions: 0 },
                ].map((day, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-sm font-medium text-gray-300">{day.day}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">{day.sessions}</span>
                      <div className={`w-2 h-2 rounded-full ${day.sessions > 0 ? 'bg-white/40' : 'bg-white/10'}`}></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-gray-400 flex items-center">
                  <Target className="w-3 h-3 mr-2" />
                  Goal: {stats.weeklyGoal} sessions this week
                </p>
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-gray-400" />
                  Recent Sessions
                </h3>
              </div>
              <div className="space-y-4">
                {[
                  {
                    id: "1",
                    persona: "Sarah Chen",
                    duration: 45,
                    rating: 4.5,
                    date: "2024-01-15",
                    notes: "Great session on anxiety management techniques",
                  },
                  {
                    id: "2",
                    persona: "Marcus Williams",
                    duration: 38,
                    rating: 4.0,
                    date: "2024-01-14",
                    notes: "Focused on active listening skills",
                  },
                  {
                    id: "3",
                    persona: "Elena Rodriguez",
                    duration: 52,
                    rating: 4.8,
                    date: "2024-01-13",
                    notes: "Excellent rapport building practice",
                  },
                ].map((session) => (
                  <div key={session.id} className="pb-4 border-b border-white/5 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-sm mb-1">{session.persona}</h4>
                        <p className="text-xs text-gray-400 mb-2">{session.notes}</p>
                      </div>
                      <div className="flex items-center space-x-1 ml-3">
                        <Star className="w-3 h-3 text-gray-400 fill-gray-400" />
                        <span className="text-xs text-gray-400">{session.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{formatTime(session.duration)} • {session.date}</p>
                  </div>
                ))}
              </div>
              <button className="mt-4 text-sm text-gray-400 hover:text-white transition-colors flex items-center group">
                View All Sessions
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Learning Path */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Target className="w-5 h-5 mr-2 text-gray-400" />
                  Learning Path
                </h3>
              </div>
              <div className="space-y-4">
                <div className="pb-4 border-b border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white text-sm">Beginner</h4>
                    <span className="text-xs text-gray-400">100%</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">Basic communication skills</p>
                  <div className="w-full bg-white/10 rounded-full h-1">
                    <div className="bg-white/40 h-1 rounded-full" style={{ width: "100%" }}></div>
                  </div>
                </div>

                <div className="pb-4 border-b border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white text-sm">Intermediate</h4>
                    <span className="text-xs text-gray-400">60%</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">Advanced therapy techniques</p>
                  <div className="w-full bg-white/10 rounded-full h-1">
                    <div className="bg-white/40 h-1 rounded-full" style={{ width: "60%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white text-sm">Advanced</h4>
                    <span className="text-xs text-gray-400">0%</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">Specialized scenarios</p>
                  <div className="w-full bg-white/10 rounded-full h-1">
                    <div className="bg-white/10 h-1 rounded-full" style={{ width: "0%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { StudentDashboard };
