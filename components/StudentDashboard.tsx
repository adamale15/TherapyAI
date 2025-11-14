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
  Brain,
  GraduationCap,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header Navigation */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBackToHome}
              className="text-gray-300 hover:text-white transition-colors flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold">TherapyAI</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
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
              Ready to practice your therapy skills? Let's continue your
              learning journey.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={onStartSession}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-4"
            >
              <PlayCircle className="w-6 h-6" />
              <div className="text-left">
                <h3 className="text-lg font-semibold">Start New Session</h3>
                <p className="text-purple-100 text-sm">
                  Practice with AI personas
                </p>
              </div>
            </button>

            <button
              onClick={onManagePersonas}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-4"
            >
              <Users className="w-6 h-6" />
              <div className="text-left">
                <h3 className="text-lg font-semibold">Manage Personas</h3>
                <p className="text-green-100 text-sm">
                  Customize your practice
                </p>
              </div>
            </button>
          </div>

          {/* University Courses Section */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-3">
            <h3 className="text-base font-semibold text-white mb-2 flex items-center">
              <GraduationCap className="w-4 h-4 mr-2 text-purple-500" />
              University Courses
            </h3>
            <div className="space-y-3">
              {/* Course 1 */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:border-purple-500/50 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-sm mb-1">
                      Introduction to Clinical Psychology
                    </h4>
                    <p className="text-xs text-gray-400 mb-2">
                      Dr. Sarah Johnson • PSYC 201
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-300">
                          In Progress
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">75% Complete</div>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                  </div>
                </div>
              </div>

              {/* Course 2 */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:border-purple-500/50 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-sm mb-1">
                      Therapeutic Communication Skills
                    </h4>
                    <p className="text-xs text-gray-400 mb-2">
                      Prof. Michael Chen • PSYC 305
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-gray-300">Available</span>
                      </div>
                      <div className="text-xs text-gray-400">Starts Jan 15</div>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
              </div>

              {/* Course 3 */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:border-purple-500/50 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-sm mb-1">
                      Cognitive Behavioral Therapy
                    </h4>
                    <p className="text-xs text-gray-400 mb-2">
                      Dr. Emily Rodriguez • PSYC 410
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-xs text-gray-300">Enrolled</span>
                      </div>
                      <div className="text-xs text-gray-400">Starts Feb 1</div>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-yellow-400" />
                  </div>
                </div>
              </div>

              {/* Course 4 */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:border-purple-500/50 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-sm mb-1">
                      Group Therapy Dynamics
                    </h4>
                    <p className="text-xs text-gray-400 mb-2">
                      Dr. James Wilson • PSYC 425
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        <span className="text-xs text-gray-300">Completed</span>
                      </div>
                      <div className="text-xs text-gray-400">Grade: A-</div>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Award className="w-4 h-4 text-green-400" />
                  </div>
                </div>
              </div>
            </div>
            <button className="mt-3 text-purple-400 hover:text-purple-300 text-xs font-medium">
              View All Courses →
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-3 hover:border-purple-500/50 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Total Sessions
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalSessions}
                  </p>
                </div>
                <BookOpen className="w-6 h-6 text-purple-500" />
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-3 hover:border-blue-500/50 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Total Time
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {formatTime(stats.totalTime)}
                  </p>
                </div>
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-3 hover:border-red-500/50 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Average Rapport
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
                    Engagement Score
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
                    Current Streak
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
                <Calendar className="w-4 h-4 mr-2 text-purple-500" />
                Weekly Progress
              </h3>
              <div className="space-y-2">
                {[
                  { day: "Mon", sessions: 1, completed: true },
                  { day: "Tue", sessions: 0, completed: false },
                  { day: "Wed", sessions: 1, completed: true },
                  { day: "Thu", sessions: 1, completed: true },
                  { day: "Fri", sessions: 0, completed: false },
                  { day: "Sat", sessions: 1, completed: true },
                  { day: "Sun", sessions: 0, completed: false },
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
                            ? "bg-green-500 text-white"
                            : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        {day.sessions}
                      </div>
                      {day.completed && (
                        <Award className="w-3 h-3 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2 bg-purple-900/30 rounded-lg">
                <p className="text-xs text-purple-300">
                  <Target className="w-3 h-3 inline mr-1" />
                  Goal: {stats.weeklyGoal} sessions this week
                </p>
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-3">
              <h3 className="text-base font-semibold text-white mb-2 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2 text-blue-500" />
                Recent Sessions
              </h3>
              <div className="space-y-3">
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
                  <div
                    key={session.id}
                    className="border-l-4 border-blue-500 pl-3 py-2"
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
              <button className="mt-3 text-blue-400 hover:text-blue-300 text-xs font-medium">
                View All Sessions →
              </button>
            </div>

            {/* Learning Path */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-3">
              <h3 className="text-base font-semibold text-white mb-2 flex items-center">
                <Target className="w-4 h-4 mr-2 text-green-500" />
                Learning Path
              </h3>
              <div className="space-y-3">
                <div className="p-3 border-2 border-green-500/30 rounded-lg bg-green-900/20">
                  <h4 className="font-semibold text-green-400 mb-1 text-sm">
                    Beginner
                  </h4>
                  <p className="text-xs text-green-300 mb-2">
                    Basic communication skills
                  </p>
                  <div className="w-full bg-green-900/30 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{ width: "100%" }}
                    ></div>
                  </div>
                  <p className="text-xs text-green-400 mt-1">Completed</p>
                </div>

                <div className="p-3 border-2 border-blue-500/30 rounded-lg bg-blue-900/20">
                  <h4 className="font-semibold text-blue-400 mb-1 text-sm">
                    Intermediate
                  </h4>
                  <p className="text-xs text-blue-300 mb-2">
                    Advanced therapy techniques
                  </p>
                  <div className="w-full bg-blue-900/30 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: "60%" }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-400 mt-1">60% Complete</p>
                </div>

                <div className="p-3 border-2 border-gray-600 rounded-lg bg-gray-800/20">
                  <h4 className="font-semibold text-gray-400 mb-1 text-sm">
                    Advanced
                  </h4>
                  <p className="text-xs text-gray-300 mb-2">
                    Specialized scenarios
                  </p>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-gray-500 h-1.5 rounded-full"
                      style={{ width: "0%" }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Not Started</p>
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
