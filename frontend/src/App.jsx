import  { useState, useEffect, useMemo } from 'react';
import Login from './components/Login';
import SignUp from './components/SignUp';
import ForgotPassword from './components/ForgotPassword';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';

// Initial mock data arrays are empty by default so dashboards render without demo data
const INITIAL_HEALTH_RECORDS = [];

// initial mock data for wellness risks, recommendations, and sentiment analysis
const INITIAL_RISKS = [];

// initial mock data for wellness recommendations and sentiment analysis
const INITIAL_RECOMMENDATIONS = [];

// initial mock data for department sentiment analysis
const INITIAL_SENTIMENTS = [];

// Main App Component
import ThemeToggle from './components/ThemeToggle';

export default function App() {
    const [screen, setScreen] = useState('login');
    const [currentUser, setCurrentUser] = useState(null);
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('wellness_theme');
        return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark';
    });


    // Core Wellness State (Moved from Dashboard)
    const [healthRecords, setHealthRecords] = useState([]);
    const [risks, setRisks] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [sentimentList, setSentimentList] = useState([]);
    const kpis = useState({
        participationRate: 78,
        absenteeismRate: 4.2,
        productivityTrend: 'up',
        overallHealthRiskScore: 34,
        programEffectiveness: 82
    });

    // Derived KPIs recalculated whenever healthRecords change
    const derivedKpis = useMemo(() => {
        if (healthRecords.length === 0) {
            return kpis;
        }

        // Calculate derived KPIs based on health records
        const highStressCount = healthRecords.filter(r => r.stressLevel === 'High').length;
        const attentionCount = healthRecords.filter(r => r.healthAssessment === 'Needs Attention').length;
        const calculatedRisk = Math.round(((highStressCount + attentionCount) / (healthRecords.length * 2)) * 100) || 25;
        const participating = healthRecords.filter(r => r.exerciseHoursPerWeek > 0 || r.sleepHoursPerNight > 6).length;
        const calculatedParticipation = Math.round((participating / healthRecords.length) * 100) || 75;
        return {
            participationRate: calculatedParticipation,
            absenteeismRate: attentionCount > 0 ? Number((attentionCount * 1.5 + 2.1).toFixed(1)) : 2.4,
            productivityTrend: highStressCount > healthRecords.length / 2 ? 'stable' : 'up',
            overallHealthRiskScore: calculatedRisk,
            programEffectiveness: Math.max(50, 100 - calculatedRisk)
        };
    }, [healthRecords, kpis]);

    // Check if a user is already logged in from a previous session
    useEffect(() => {
        try {
            const savedUser = localStorage.getItem('wellness_current_user');
            if (savedUser) {
                // Defer state updates to avoid synchronous cascading renders
                setTimeout(() => {
                    setCurrentUser(JSON.parse(savedUser));
                    setScreen('dashboard');
                }, 0);
            }
        }
        catch (err) {
            console.error('Failed to load user session', err);
        }
    }, []);

    // Sync state from localStorage on mount, or write initial data when currentUser changes
    useEffect(() => {
        if (!currentUser)
            return;
        setTimeout(() => {
            // 1. Health Records
            const savedHR = localStorage.getItem('wellness_health_records');
            let loadedHR = savedHR ? JSON.parse(savedHR) : INITIAL_HEALTH_RECORDS;
            // Check if the current user has a record. If not, create and seed one!
            const userEmpId = `user-emp-${currentUser.id}`;
            const userHasRecord = loadedHR.some((r) => r.employeeId === userEmpId);
            if (!userHasRecord) {
                const newUserHR = {
                    id: `hr-user-${currentUser.id}`,
                    employeeId: userEmpId,
                    employeeName: currentUser.name,
                    department: 'Engineering',
                    bmi: 23.5,
                    bloodPressure: '120/80',
                    exerciseHoursPerWeek: 3.5,
                    sleepHoursPerNight: 7,
                    stressLevel: 'Medium',
                    healthAssessment: 'Good',
                    lastUpdated: new Date().toISOString().split('T')[0]
                };
                loadedHR = [newUserHR, ...loadedHR];
                localStorage.setItem('wellness_health_records', JSON.stringify(loadedHR));
            }
            setHealthRecords(loadedHR);
            // 2. Risks
            const savedRisks = localStorage.getItem('wellness_risks');
            if (savedRisks) {
                setRisks(JSON.parse(savedRisks));
            }
            else {
                localStorage.setItem('wellness_risks', JSON.stringify(INITIAL_RISKS));
                setRisks(INITIAL_RISKS);
            }
            // 3. Recommendations
            const savedRecs = localStorage.getItem('wellness_recommendations');
            if (savedRecs) {
                setRecommendations(JSON.parse(savedRecs));
            }
            else {
                localStorage.setItem('wellness_recommendations', JSON.stringify(INITIAL_RECOMMENDATIONS));
                setRecommendations(INITIAL_RECOMMENDATIONS);
            }
            // 4. Sentiment
            const savedSent = localStorage.getItem('wellness_sentiments');
            if (savedSent) {
                setSentimentList(JSON.parse(savedSent));
            }
            else {
                localStorage.setItem('wellness_sentiments', JSON.stringify(INITIAL_SENTIMENTS));
                setSentimentList(INITIAL_SENTIMENTS);
            }
        }, 0);
    }, [currentUser]);

    // Sync state modifications and recalculate risks
    useEffect(() => {
        if (healthRecords.length === 0)
            return;
        // Auto-update wellness risk list dynamically based on updated health records
        const updatedRisks = healthRecords.map(r => {
            let score = 20;
            const factors = [];
            let riskType = 'None';
            let action = 'Maintain current healthy habit levels and claim monthly gym rewards.';
            const [sys, dia] = r.bloodPressure.split('/').map(Number);
            if (r.stressLevel === 'High') {
                score += 35;
                factors.push('High self-reported stress');
            }
            if (r.sleepHoursPerNight < 6) {
                score += 25;
                factors.push('Insufficient sleep (< 6 hrs)');
            }
            if (r.bmi >= 30) {
                score += 25;
                factors.push(`Obese BMI: ${r.bmi}`);
                riskType = 'Obesity';
            }
            if (sys >= 140 || dia >= 90) {
                score += 30;
                factors.push(`Hypertension BP: ${r.bloodPressure}`);
                riskType = 'Hypertension';
            }
            if (r.exerciseHoursPerWeek === 0) {
                score += 15;
                factors.push('Sedentary lifestyle (0 exercise)');
            }
            if (score >= 70) {
                if (riskType === 'None')
                    riskType = 'Burnout';
                action = `Schedule wellness check-up, mandate rest days, and advise joining the ${riskType === 'Hypertension' ? 'Cardio endurance plan' : 'Stress Reduction program'}.`;
            }
            else if (score >= 45) {
                riskType = 'Stress';
                action = 'Offer guided ergonomic workspace reviews and recommend the Diaphragmatic Breathing program.';
            }
            return {
                employeeId: r.employeeId,
                employeeName: r.employeeName,
                riskType,
                riskScore: Math.min(100, score),
                factors: factors.length > 0 ? factors : ['Vitals check within ideal levels'],
                recommendationAction: action
            };
        });
        
        // Defer state update to avoid cascading renders
        setTimeout(() => {
            localStorage.setItem('wellness_risks', JSON.stringify(updatedRisks));
            setRisks(updatedRisks);
        }, 0);
    }, [healthRecords]);

    // Event Handlers for User Actions
    const handleAddHealthRecord = (newRecord) => {
        const updated = [newRecord, ...healthRecords];
        setHealthRecords(updated);
        localStorage.setItem('wellness_health_records', JSON.stringify(updated));
    };

    // Update a specific user's health record and persist changes
    const handleUpdateUserRecord = (updatedRecord) => {
        const updated = healthRecords.map(r => r.employeeId === updatedRecord.employeeId ? updatedRecord : r);
        setHealthRecords(updated);
        localStorage.setItem('wellness_health_records', JSON.stringify(updated));
    };

    // Update department sentiment pulse based on new feedback and persist changes
    const handleUpdateSentimentPulse = (deptName, stressScore, newIssue) => {
        const updatedSentiments = sentimentList.map(s => {
            if (s.department.toLowerCase() === deptName.toLowerCase()) {
                const count = s.recentFeedbackCount + 1;
                const oldTotal = s.averageStressScore * s.recentFeedbackCount;
                const newAverage = Number(((oldTotal + stressScore) / count).toFixed(1));
                let posChange = s.sentimentDistribution.positive;
                let neuChange = s.sentimentDistribution.neutral;
                let negChange = s.sentimentDistribution.negative;
                if (stressScore <= 3) {
                    posChange = Math.min(100, Math.round((posChange * s.recentFeedbackCount + 100) / count));
                }
                else if (stressScore <= 7) {
                    neuChange = Math.min(100, Math.round((neuChange * s.recentFeedbackCount + 100) / count));
                }
                else {
                    negChange = Math.min(100, Math.round((negChange * s.recentFeedbackCount + 100) / count));
                }
                const totalDist = posChange + neuChange + negChange;
                const posPercent = Math.round((posChange / totalDist) * 100);
                const neuPercent = Math.round((neuChange / totalDist) * 100);
                const negPercent = Math.max(0, 100 - posPercent - neuPercent);
                const updatedIssues = newIssue.trim()
                    ? [newIssue.trim(), ...s.keyIssues].slice(0, 5)
                    : s.keyIssues;
                return {
                    ...s,
                    averageStressScore: newAverage,
                    sentimentDistribution: {
                        positive: posPercent,
                        neutral: neuPercent,
                        negative: negPercent
                    },
                    keyIssues: updatedIssues,
                    recentFeedbackCount: count
                };
            }
            return s;
        });
        localStorage.setItem('wellness_sentiments', JSON.stringify(updatedSentiments));
        setSentimentList(updatedSentiments);
    };

    // Navigation and Authentication Handlers
    const handleLoginSuccess = (user) => {
        setCurrentUser(user);
        localStorage.setItem('wellness_current_user', JSON.stringify(user));
        setScreen('dashboard');
    };

    // Handle successful sign-up by redirecting to login screen
    const handleSignUpSuccess = () => {
        setScreen('login');
    };

    // Logout handler to clear user session and redirect to login
    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('wellness_current_user');
        setScreen('login');
    };

    // Navigation handler to switch between screens
    const handleNavigate = (targetScreen) => {
        setScreen(targetScreen);
    };

    const toggleTheme = () => {
        setTheme(prevTheme => {
            const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('wellness_theme', newTheme);
            document.documentElement.classList.remove(`theme-${prevTheme}`);
            document.documentElement.classList.add(`theme-${newTheme}`);
            return newTheme;
        });
    };

    // Render the appropriate screen based on current state
    return (
        <div className={`min-h-screen font-sans ${theme === 'dark' ? 'bg-[#050505] text-[#e0e0e0]' : 'bg-white text-black'}`}>
            {screen !== 'dashboard' && <ThemeToggle theme={theme} toggleTheme={toggleTheme} />}
            {screen === 'login' && (<Login onNavigate={handleNavigate}
                onLoginSuccess={handleLoginSuccess} />)}

            {screen === 'signup' && (<SignUp onNavigate={handleNavigate}
                onSignUpSuccess={handleSignUpSuccess} />)}

            {screen === 'forgot_password' && (<ForgotPassword
                onNavigate={handleNavigate} />)}

            {screen === 'dashboard' && currentUser && (currentUser.role === 'admin' ?
                (<AdminDashboard
                    user={currentUser}
                    onLogout={handleLogout}
                    healthRecords={healthRecords}
                    risks={risks}
                    recommendations={recommendations}
                    sentimentList={sentimentList}
                    kpis={derivedKpis}
                    onAddHealthRecord={handleAddHealthRecord}
                    themeToggle={<ThemeToggle theme={theme} toggleTheme={toggleTheme} />} />)
                :
                (<UserDashboard
                    user={currentUser}
                    onLogout={handleLogout}
                    healthRecords={healthRecords}
                    onUpdateUserRecord={handleUpdateUserRecord}
                    onUpdateSentimentPulse={handleUpdateSentimentPulse}
                    recommendations={recommendations}
                    themeToggle={<ThemeToggle theme={theme} toggleTheme={toggleTheme} />} />)
            )}
        </div>
    );
}