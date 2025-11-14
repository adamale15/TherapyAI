import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Users,
  BarChart3,
  Clock,
  Target,
  TrendingUp,
  PlayCircle,
  FileText,
  Award,
  Calendar,
  MessageSquare,
  Star,
  Heart,
  ArrowLeft,
  User,
  ClipboardList,
  GraduationCap,
  Brain,
} from "lucide-react";

interface PractitionerDashboardProps {
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

const PractitionerDashboard: React.FC<PractitionerDashboardProps> = ({
  user,
  onStartSession,
  onManagePersonas,
  onBackToHome,
}) => {
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 24,
    totalTime: 960, // minutes
    averageRapport: 4.5,
    averageEngagement: 4.2,
    completedPersonas: 5,
    currentStreak: 8,
    weeklyGoal: 5,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header Navigation */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBackToHome}
              className="text-gray-300 hover:text-white transition-colors flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold">TherapyAI</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
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

      <div className="p-4 flex items-center justify-center">
        <div className="max-w-6xl mx-auto w-full space-y-8">
          {/* Welcome Header */}
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {getGreeting()}, {user.email.split("@")[0]}!
            </h1>
            <p className="text-base text-gray-300">
              Welcome to your practitioner dashboard. Access advanced training
              tools and assessment features.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={onStartSession}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-4"
            >
              <PlayCircle className="w-6 h-6" />
              <div className="text-left">
                <h3 className="text-lg font-semibold">
                  Start Training Session
                </h3>
                <p className="text-blue-100 text-sm">
                  Practice with advanced scenarios
                </p>
              </div>
            </button>

            <button
              onClick={onManagePersonas}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-4"
            >
              <Users className="w-6 h-6" />
              <div className="text-left">
                <h3 className="text-lg font-semibold">Manage Personas</h3>
                <p className="text-purple-100 text-sm">
                  Create and customize training cases
                </p>
              </div>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-3 hover:border-blue-500/50 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Training Sessions
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalSessions}
                  </p>
                </div>
                <GraduationCap className="w-6 h-6 text-blue-500" />
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-3 hover:border-cyan-500/50 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Total Time
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {formatTime(stats.totalTime)}
                  </p>
                </div>
                <Clock className="w-6 h-6 text-cyan-500" />
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-3 hover:border-red-500/50 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Teaching Score
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {stats.averageRapport}
                  </p>
                </div>
                <Heart className="w-6 h-6 text-red-500" />
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-3 hover:border-orange-500/50 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Assessment Score
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {stats.averageEngagement}
                  </p>
                </div>
                <Target className="w-6 h-6 text-orange-500" />
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-3 hover:border-green-500/50 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Active Streak
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {stats.currentStreak} days
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          {/* Bottom Sections - Compact Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Weekly Progress */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-3">
              <h3 className="text-base font-semibold text-white mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                Weekly Training
              </h3>
              <div className="space-y-2">
                {[
                  { day: "Mon", sessions: 2, completed: true },
                  { day: "Tue", sessions: 1, completed: true },
                  { day: "Wed", sessions: 3, completed: true },
                  { day: "Thu", sessions: 2, completed: true },
                  { day: "Fri", sessions: 1, completed: true },
                  { day: "Sat", sessions: 0, completed: false },
                  { day: "Sun", sessions: 1, completed: true },
                ].map((day, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-gray-400">
                      {day.day}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          day.completed
                            ? "bg-blue-500 text-white"
                            : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        {day.sessions}
                      </div>
                      {day.completed && (
                        <Award className="w-3 h-3 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2 bg-blue-900/30 rounded-lg">
                <p className="text-xs text-blue-300">
                  <Target className="w-3 h-3 inline mr-1" />
                  Goal: {stats.weeklyGoal} sessions this week
                </p>
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-3">
              <h3 className="text-base font-semibold text-white mb-2 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2 text-purple-500" />
                Recent Training
              </h3>
              <div className="space-y-3">
                {[
                  {
                    id: "1",
                    persona: "Advanced Case - PTSD",
                    duration: 65,
                    rating: 4.8,
                    date: "2024-01-15",
                    notes: "Complex trauma intervention techniques",
                  },
                  {
                    id: "2",
                    persona: "Crisis Management",
                    duration: 45,
                    rating: 4.5,
                    date: "2024-01-14",
                    notes: "Emergency response protocols",
                  },
                  {
                    id: "3",
                    persona: "Group Therapy Simulation",
                    duration: 80,
                    rating: 4.9,
                    date: "2024-01-13",
                    notes: "Multi-participant scenario training",
                  },
                ].map((session) => (
                  <div
                    key={session.id}
                    className="border-l-4 border-purple-500 pl-3 py-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-white text-sm">
                        {session.persona}
                      </h4>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-gray-400">
                          {session.rating}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">
                      {formatTime(session.duration)} • {session.date}
                    </p>
                    <p className="text-xs text-gray-500">{session.notes}</p>
                  </div>
                ))}
              </div>
              <button className="mt-3 text-purple-400 hover:text-purple-300 text-xs font-medium">
                View All Sessions →
              </button>
            </div>

            {/* Professional Development */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-3">
              <h3 className="text-base font-semibold text-white mb-2 flex items-center">
                <ClipboardList className="w-4 h-4 mr-2 text-green-500" />
                Professional Development
              </h3>
              <div className="space-y-3">
                <div className="p-3 border-2 border-green-500/30 rounded-lg bg-green-900/20">
                  <h4 className="font-semibold text-green-400 mb-1 text-sm">
                    Advanced Techniques
                  </h4>
                  <p className="text-xs text-green-300 mb-2">
                    CBT and DBT methodologies
                  </p>
                  <div className="w-full bg-green-900/30 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{ width: "85%" }}
                    ></div>
                  </div>
                  <p className="text-xs text-green-400 mt-1">85% Complete</p>
                </div>

                <div className="p-3 border-2 border-blue-500/30 rounded-lg bg-blue-900/20">
                  <h4 className="font-semibold text-blue-400 mb-1 text-sm">
                    Crisis Intervention
                  </h4>
                  <p className="text-xs text-blue-300 mb-2">
                    Emergency response protocols
                  </p>
                  <div className="w-full bg-blue-900/30 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: "70%" }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-400 mt-1">70% Complete</p>
                </div>

                <div className="p-3 border-2 border-purple-500/30 rounded-lg bg-purple-900/20">
                  <h4 className="font-semibold text-purple-400 mb-1 text-sm">
                    Research Methods
                  </h4>
                  <p className="text-xs text-purple-300 mb-2">
                    Evidence-based practice
                  </p>
                  <div className="w-full bg-purple-900/30 rounded-full h-1.5">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full"
                      style={{ width: "45%" }}
                    ></div>
                  </div>
                  <p className="text-xs text-purple-400 mt-1">45% Complete</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { PractitionerDashboard };
