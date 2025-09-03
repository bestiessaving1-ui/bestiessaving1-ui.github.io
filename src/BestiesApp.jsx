import React, { useState, useEffect, useMemo } from 'react';
import './bestiesapp.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';

// Icons (same as before)
const Wallet = () => <div className="icon">💰</div>;
const Users = () => <div className="icon">👥</div>;
const FileText = () => <div className="icon">📄</div>;
const Calculator = () => <div className="icon">🧮</div>;
const SettingsIcon = () => <div className="icon">⚙️</div>;
const LogOut = () => <div className="icon">🚪</div>;
const Plus = () => <div className="icon">➕</div>;
const Trash2 = () => <div className="icon">🗑️</div>;
const Edit = () => <div className="icon">✏️</div>;
const DollarSign = () => <div className="icon">💵</div>;
const Loader2 = () => <div className="icon spinner">⏳</div>;
const User = () => <div className="icon">👤</div>;
const Eye = () => <div className="icon">👁️</div>;
const EyeOff = () => <div className="icon">👁️‍🗨️</div>;
const Calendar = () => <div className="icon">📅</div>;
const CreditCard = () => <div className="icon">💳</div>;
const BarChart3 = () => <div className="icon">📊</div>;
const AlertCircle = () => <div className="icon">⚠️</div>;
const CheckCircle = () => <div className="icon">✅</div>;
const Download = () => <div className="icon">📥</div>;
const ChevronLeft = () => <div className="icon">◀️</div>;
const ChevronRight = () => <div className="icon">▶️</div>;
const ArrowUpDown = () => <div className="icon">↕️</div>;
const Search = () => <div className="icon">🔍</div>;
const RefreshCw = () => <div className="icon">🔄</div>;
const DatabaseIcon = () => <div className="icon">💾</div>;
const ShieldIcon = () => <div className="icon">🛡️</div>;
const SaveIcon = () => <div className="icon">💾</div>;
const DownloadIcon = () => <div className="icon">📥</div>;
const UploadIcon = () => <div className="icon">📤</div>;
const TrashIcon = () => <div className="icon">🗑️</div>;
const Mail = () => <div className="icon">📧</div>;
const Lock = () => <div className="icon">🔒</div>;
const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

// Utility Functions (same as before)
const isValidBSDate = (dateString) => {
  if (!dateString) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const [year, month, day] = dateString.split('-').map(Number);
  if (year < 2000 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 32) return false;
  
  return true;
};

const validateFinancialInput = (value) => {
  if (!value) return true;
  const numValue = Number(value);
  if (isNaN(numValue)) return false;
  if (numValue < 0) return false;
  if (numValue > 100000000) return false;
  return true;
};

const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    }).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

const currency = (n) =>
  `Rs. ${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}`;

// Reusable Components (same as before)
const Card = ({ children, className, ...props }) => (
  <div className={`card ${className}`} {...props}>{children}</div>
);

const CardContent = ({ children }) => (
  <div className="card-content">{children}</div>
);

const Button = ({ children, onClick, variant = 'default', className, disabled, ...props }) => (
  <button 
    className={`btn ${variant} ${className} ${disabled ? 'disabled' : ''}`} 
    onClick={onClick} 
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);

const Input = ({ value, onChange, placeholder, type = 'text', className, icon, suffix, ...props }) => (
  <div className="input-container">
    {icon && <span className="input-icon">{icon}</span>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`input ${className} ${icon ? 'with-icon' : ''} ${suffix ? 'with-suffix' : ''}`}
      {...props}
    />
    {suffix && <span className="input-suffix">{suffix}</span>}
  </div>
);

const Select = ({ value, onValueChange, children, ...props }) => (
  <select value={value} onChange={(e) => onValueChange(e.target.value)} className="select" {...props}>
    {children}
  </select>
);

const ErrorMessage = ({ error, onRetry }) => {
  if (!error) return null;
  
  return (
    <Card className="error">
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle />
            <span>{error}</span>
          </div>
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const SuccessMessage = ({ success }) => {
  if (!success) return null;
  
  return (
    <Card className="success">
      <CardContent>
        <div className="flex items-center">
          <CheckCircle />
          <span>{success}</span>
        </div>
      </CardContent>
    </Card>
  );
};

const LoadingSpinner = ({ text = "Loading..." }) => (
  <div className="loading-spinner">
    <Loader2 />
    <p>{text}</p>
  </div>
);

// Custom hook for Firebase data operations - UPDATED FOR SHARED DATA
const useFirestoreData = (collectionName, userId, isAdmin = false) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    
    // For shared data, we don't filter by userId
    const q = isAdmin 
      ? query(collection(db, collectionName)) // Admins see all data
      : query(collection(db, collectionName)); // All users see the same data
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const newData = [];
        snapshot.forEach((doc) => {
          newData.push({ id: doc.id, ...doc.data() });
        });
        setData(newData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, userId, isAdmin]);

  const addDocument = async (newData) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...newData,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateDocument = async (id, updates) => {
    try {
      await updateDoc(doc(db, collectionName, id), updates);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteDocument = async (id) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { data, loading, error, addDocument, updateDocument, deleteDocument };
};

// Days data from Hamro Patro (same as before)
const daysData = {
  2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 31],
  2082: [31, 31, 32, 31, 31, 31, 30, 30, 30, 29, 30, 30],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2084: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2085: [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2086: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2087: [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30],
  2088: [30, 31, 32, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2089: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2090: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
};

const defaultDays = [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30, 30];

// Custom hook for fiscal year dates (same as before)
const useFiscalYearDates = () => {
  const generateFiscalYearDates = async (fiscalYear) => {
    const [startYear, endYear] = fiscalYear.split('/').map(Number);
    
    const months = [
      { name: 'Magh', standardMonth: 10 },
      { name: 'Falgun', standardMonth: 11 },
      { name: 'Chaitra', standardMonth: 12 },
      { name: 'Baisakh', standardMonth: 1 },
      { name: 'Jestha', standardMonth: 2 },
      { name: 'Ashad', standardMonth: 3 },
      { name: 'Shrawan', standardMonth: 4 },
      { name: 'Bhadra', standardMonth: 5 },
      { name: 'Ashwin', standardMonth: 6 },
      { name: 'Kartik', standardMonth: 7 },
      { name: 'Mangsir', standardMonth: 8 },
      { name: 'Poush', standardMonth: 9 }
    ];

    const dates = [];

    let currentYear = startYear;
    let dayCount = 1;

    for (let i = 0; i < months.length; i++) {
      const month = months[i];
      const yearForDays = (i < 3) ? startYear : endYear;
      const daysInMonth = (daysData[yearForDays] ? daysData[yearForDays][month.standardMonth - 1] : defaultDays[month.standardMonth - 1]) || 30;

      const monthNum = month.standardMonth;
      
      if (i > 2) {
        currentYear = endYear;
      }
      
      for (let day = 1; day <= daysInMonth; day++) {
        dates.push({
          dateBs: `${currentYear}-${monthNum.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
          quarter: calculateQuarter(i, day),
          dayOfYear: dayCount++
        });
      }
    }

    return dates;
  };

  const calculateQuarter = (monthIndex, day) => {
    let quarter = Math.floor(monthIndex / 3) + 1;
    const isQuarterStartMonth = (monthIndex % 3 === 0);
    if (isQuarterStartMonth && day < 3) {
      quarter = (quarter === 1) ? 4 : quarter - 1;
    }
    return quarter;
  };

  return { generateFiscalYearDates };
};

// LoginPage Component 
const LoginPage = ({ setIsAuthenticated, setUser, setUserRole }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAdminRegistration, setIsAdminRegistration] = useState(false);

  const navigate = useNavigate();

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  // Check if user is admin by looking up in Firebase admins collection
  const checkIfUserIsAdmin = async (userId) => {
    try {
      const adminDoc = await getDocs(query(collection(db, "admins"), where("userId", "==", userId)));
      return !adminDoc.empty;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user is admin
      const isAdmin = await checkIfUserIsAdmin(userCredential.user.uid);
      
      setIsAuthenticated(true);
      setUser(userCredential.user);
      setUserRole(isAdmin ? "admin" : "user");
      setError(null);

      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !fullName) {
      setError("Please fill in all fields.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Store additional user data in Firestore
      await addDoc(collection(db, "users"), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        fullName,
        createdAt: serverTimestamp(),
      });
      
      // If admin registration, add to admins collection
      if (isAdminRegistration) {
        await addDoc(collection(db, "admins"), {
          userId: userCredential.user.uid,
          email: userCredential.user.email,
          fullName,
          createdAt: serverTimestamp(),
        });
      }
      
      setError(null);
      setSuccess("Registration successful! Redirecting...");

      setIsAuthenticated(true);
      setUser(userCredential.user);
      setUserRole(isAdminRegistration ? "admin" : "user");

      navigate("/dashboard", { replace: true });

      setIsRegistering(false);
      setPassword("");
      setConfirmPassword("");
      setIsAdminRegistration(false);
    } catch (error) {
      console.error("Registration error:", error);
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-content">
          <Card className="login-card">
            <CardContent>
              <div className="login-header">
                <div className="app-logo">
                  <Wallet />
                  <h1>The Besties Saving</h1>
                </div>
                <p className="login-subtitle">
                  {isRegistering ? "Create your account" : "Sign in to your account"}
                </p>
              </div>

              {(error || success) && (
                <div className={`message-container ${error ? "error" : "success"}`}>
                  {error ? <AlertCircle /> : <CheckCircle />}
                  <span>{error || success}</span>
                </div>
              )}

              <div className="login-form">
                {isRegistering && (
                  <div className="form-group">
                    <label>Full Name</label>
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      icon={<User />}
                    />
                  </div>
                )}
                
                <div className="form-group">
                  <label>Email Address</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    icon={<Mail />}
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    icon={<Lock />}
                    suffix={
                      <button 
                        type="button" 
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    }
                  />
                </div>

                {isRegistering && (
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      icon={<Lock />}
                    />
                  </div>
                )}

                {!isRegistering && (
                  <div className="forgot-password">
                    <a href="#forgot">Forgot your password?</a>
                  </div>
                )}

                <Button
                  onClick={isRegistering ? handleRegister : handleLogin}
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 />
                  ) : (
                    isRegistering ? "Create Account" : "Sign In"
                  )}
                </Button>

                <div className="auth-switch">
                  <p>
                    {isRegistering ? "Already have an account?" : "Don't have an account?"}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(!isRegistering);
                        setError(null);
                        setSuccess(null);
                        setIsAdminRegistration(false);
                      }}
                    >
                      {isRegistering ? "Sign In" : "Register"}
                    </button>
                  </p>
                </div>

                {!isRegistering && (
                  <div className="admin-register-link">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(true);
                        setIsAdminRegistration(true);
                        setError(null);
                        setSuccess(null);
                      }}
                    >
                      Register as Admin
                    </button>
                  </div>
                )}
              </div>

              {isRegistering && !isAdminRegistration && (
                <div className="registration-notice">
                  <div className="notice-header">
                    <InfoIcon />
                    <span>View-Only Access</span>
                  </div>
                  <p>New accounts have view-only access. Contact an administrator for full access privileges.</p>
                </div>
              )}

              {isRegistering && isAdminRegistration && (
                <div className="registration-notice admin">
                  <div className="notice-header">
                    <InfoIcon />
                    <span>Administrator Registration</span>
                  </div>
                  <p>You are registering as an administrator. This account will have full access to modify all data.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component 
const Dashboard = ({ userId, isAdmin, userName }) => {
  const { data: members } = useFirestoreData('members', userId, isAdmin);
  const { data: loans } = useFirestoreData('loans', userId, isAdmin);
  const { data: transactions } = useFirestoreData('transactions', userId, isAdmin);
  const { data: groupTransactions } = useFirestoreData('groupTransactions', userId, isAdmin);

  const totalSavings = useMemo(() => {
    return transactions
      .filter(t => t.type === 'saving')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const totalWithdrawals = useMemo(() => {
    return transactions
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const totalCashIn = useMemo(() => {
    return groupTransactions
      .filter(t => t.type === 'in')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [groupTransactions]);

  const totalCashOut = useMemo(() => {
    return groupTransactions
      .filter(t => t.type === 'out')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [groupTransactions]);

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Welcome back, {userName || "User"}!</h1>
          <p>Here's your financial overview</p>
        </div>
        <div className="header-badge">
          <BarChart3 />
          <span>Real-time Data</span>
          {isAdmin && <span className="admin-badge">Admin</span>}
        </div>
      </div>
      
      <div className="stats-grid">
        <Card className="stat-card green">
          <CardContent>
            <div className="stat-header">
              <Wallet />
              <span className="badge">Savings</span>
            </div>
            <div className="stat-value">{currency(totalSavings)}</div>
            <div className="stat-label">Total Savings</div>
          </CardContent>
        </Card>
        
        <Card className="stat-card red">
          <CardContent>
            <div className="stat-header">
              <CreditCard />
              <span className="badge">Withdrawals</span>
            </div>
            <div className="stat-value">{currency(totalWithdrawals)}</div>
            <div className="stat-label">Total Withdrawals</div>
          </CardContent>
        </Card>
        
        <Card className="stat-card blue">
          <CardContent>
            <div className="stat-header">
              <DollarSign />
              <span className="badge">Income</span>
            </div>
            <div className="stat-value">{currency(totalCashIn)}</div>
            <div className="stat-label">Total Cash In</div>
          </CardContent>
        </Card>
        
        <Card className="stat-card orange">
          <CardContent>
            <div className="stat-header">
              <Calculator />
              <span className="badge">Expenses</span>
            </div>
            <div className="stat-value">{currency(totalCashOut)}</div>
            <div className="stat-label">Total Cash Out</div>
          </CardContent>
        </Card>
      </div>

      <div className="dashboard-detail">
        <Card className="detail-card">
          <CardContent>
            <div className="detail-header">
              <Users />
              <h3>Recent Members ({members.length})</h3>
            </div>
            <div className="detail-list">
              {members.slice(0, 5).map(member => (
                <div key={member.id} className="list-item">
                  <span className="item-name">{member.name}</span>
                  <span className="item-info">{member.phone || "No phone"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="detail-card">
          <CardContent>
            <div className="detail-header">
              <CreditCard />
              <h3>Recent Loans ({loans.length})</h3>
            </div>
            <div className="detail-list">
              {loans.slice(0, 5).map(loan => (
                <div key={loan.id} className="list-item">
                  <span className="item-name">
                    {members.find(m => m.id === loan.memberId)?.name || "Unknown Member"}
                  </span>
                  <span className="item-amount">{currency(loan.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// MembersTab Component 
const MembersTab = ({ userId, isAdmin }) => {
  const { data: members, loading, error: firestoreError, addDocument, updateDocument, deleteDocument } = useFirestoreData('members', userId, isAdmin);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [joinedDate, setJoinedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editJoinedDate, setEditJoinedDate] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedMembers = useMemo(() => {
    let sortableItems = [...members];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [members, sortConfig]);

  const filteredMembers = useMemo(() => {
    return sortedMembers.filter(member => 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.phone && member.phone.includes(searchTerm))
    );
  }, [sortedMembers, searchTerm]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const currentMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMembers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMembers, currentPage, itemsPerPage]);

  const addMember = async () => {
    if (!isAdmin) {
      setError("Only administrators can add members.");
      return;
    }
    
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (phone && !/^\d+$/.test(phone)) {
      setError("Phone number should contain only digits.");
      return;
    }
    if (!joinedDate || !isValidBSDate(joinedDate)) {
      setError("Please enter a valid date in YYYY-MM-DD format.");
      return;
    }
    
    try {
      await addDocument({
        name: name.trim(),
        phone: phone.trim() || "",
        joinedDate: joinedDate
      });
      
      setName("");
      setPhone("");
      setJoinedDate(new Date().toISOString().split('T')[0]);
      setError(null);
      setSuccess("Member added successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (member) => {
    if (!isAdmin) {
      setError("Only administrators can edit members.");
      return;
    }
    setEditingId(member.id);
    setEditName(member.name);
    setEditPhone(member.phone || "");
    setEditJoinedDate(member.joinedDate || new Date().toISOString().split('T')[0]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditPhone("");
    setEditJoinedDate("");
  };

  const saveEdit = async (id) => {
    if (!isAdmin) {
      setError("Only administrators can edit members.");
      return;
    }
    
    if (!editName.trim()) {
      setError("Name is required.");
      return;
    }
    if (editPhone && !/^\d+$/.test(editPhone)) {
      setError("Phone number should contain only digits.");
      return;
    }
    if (!editJoinedDate || !isValidBSDate(editJoinedDate)) {
      setError("Please enter a valid date in YYYY-MM-DD format.");
      return;
    }
    
    try {
      await updateDocument(id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        joinedDate: editJoinedDate
      });
      
      setEditingId(null);
      setError(null);
      setSuccess("Member updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteMember = async (id) => {
    if (!isAdmin) {
      setError("Only administrators can delete members.");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this member?")) return;
    
    try {
      await deleteDocument(id);
      setError(null);
      setSuccess("Member deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExport = () => {
    exportToCSV(members, 'members.csv');
  };

  if (loading) return <LoadingSpinner text="Loading members..." />;

  return (
    <div className="tab-content">
      <div className="page-header">
        <h1>Members Management</h1>
        <div className="header-actions">
          <Button onClick={handleExport} variant="outline">
            <Download /> Export
          </Button>
          <div className="header-badge">
            <Users />
            <span>{members.length} Members</span>
            {isAdmin && <span className="admin-badge">Admin</span>}
          </div>
        </div>
      </div>

      <ErrorMessage error={error || firestoreError} />
      <SuccessMessage success={success} />

      {isAdmin && (
        <Card className="form-card">
          <CardContent>
            <h2>Add New Member</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Name *</label>
                <Input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Member name"
                />
              </div>
              <div className="form-group">
                <label>Phone (optional)</label>
                <Input 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="98XXXXXXXX"
                />
              </div>
              <div className="form-group">
                <label>Join Date *</label>
                <Input 
                  type="date"
                  value={joinedDate} 
                  onChange={e => setJoinedDate(e.target.value)} 
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <Button onClick={addMember} className="form-btn">
                <Plus /> Add Member
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="data-card">
        <CardContent>
          <div className="data-header">
            <h2>All Members</h2>
            <div className="data-actions">
              <div className="search-box">
                <Search />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                <RefreshCw />
              </Button>
            </div>
          </div>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')}>
                    <div className="table-header">
                      Name <ArrowUpDown />
                    </div>
                  </th>
                  <th onClick={() => handleSort('phone')}>
                    <div className="table-header">
                      Phone <ArrowUpDown />
                    </div>
                  </th>
                  <th onClick={() => handleSort('joinedDate')}>
                    <div className="table-header">
                      Join Date <ArrowUpDown />
                    </div>
                  </th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {currentMembers.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 4 : 3} className="no-data">
                      <Users />
                      <div>No members found.</div>
                    </td>
                  </tr>
                ) : (
                  currentMembers.map(member => (
                    <tr key={member.id}>
                      <td>
                        {editingId === member.id ? (
                          <Input 
                            value={editName} 
                            onChange={e => setEditName(e.target.value)}
                          />
                        ) : (
                          <div className="data-value">{member.name}</div>
                        )}
                      </td>
                      <td>
                        {editingId === member.id ? (
                          <Input 
                            value={editPhone} 
                            onChange={e => setEditPhone(e.target.value)}
                          />
                        ) : (
                          <span className={member.phone ? "data-value" : "data-muted"}>
                            {member.phone || "-"}
                          </span>
                        )}
                      </td>
                      <td>
                        {editingId === member.id ? (
                          <Input 
                            type="date"
                            value={editJoinedDate} 
                            onChange={e => setEditJoinedDate(e.target.value)}
                          />
                        ) : (
                          <div className="data-value">{member.joinedDate}</div>
                        )}
                      </td>
                      {isAdmin && (
                        <td>
                          {editingId === member.id ? (
                            <div className="action-buttons">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => saveEdit(member.id)}
                              >
                                <CheckCircle />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={cancelEdit}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <div className="action-buttons">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => startEdit(member)}
                              >
                                <Edit /> Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => deleteMember(member.id)}
                              >
                                <Trash2 /> Delete
                              </Button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-info">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredMembers.length)} of {filteredMembers.length} entries
              </div>
              <div className="pagination-controls">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft />
                </Button>
                <span className="pagination-page">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// TransactionsTab Component
const TransactionsTab = ({ userId, isAdmin }) => {
  const { data: members } = useFirestoreData('members', userId, isAdmin);
  const { data: transactions, addDocument, updateDocument, deleteDocument } = useFirestoreData('transactions', userId, isAdmin);
  const { data: settingsData } = useFirestoreData('settings', userId, isAdmin);
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedFiscalYear, setSelectedFiscalYear] = useState("2081/2082");
  const [selectedQuarter, setSelectedQuarter] = useState("all");
  const [savingsData, setSavingsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { generateFiscalYearDates } = useFiscalYearDates();
  const [fiscalYears] = useState(["2081/2082", "2082/2083", "2083/2084", "2084/2085", "2085/2086", "2086/2087", "2087/2088", "2088/2089", "2089/2090", "2090/2091", "2091/2092"]);

  const savingsInterestRate = useMemo(() => {
    if (settingsData && settingsData.length > 0) {
      return parseFloat(settingsData[0].savingsInterestRate) / 100;
    }
    return 0.05;
  }, [settingsData]);

  const quarters = [
    { value: "all", label: "All Quarters" },
    { value: "1", label: "Q1: Magh 3 to Baisakh 2" },
    { value: "2", label: "Q2: Baisakh 3 to Shrawan 2" },
    { value: "3", label: "Q3: Shrawan 3 to Kartik 2" },
    { value: "4", label: "Q4: Kartik 3 to Magh 2" }
  ];

  useEffect(() => {
    if (selectedMember && selectedFiscalYear) {
      calculate();
    }
  }, [selectedMember, selectedFiscalYear, selectedQuarter, transactions, savingsInterestRate]);

  const getQuarterLabel = (quarter) => {
    switch(quarter) {
      case 1: return "Q1: Magh 3 to Baisakh 2";
      case 2: return "Q2: Baisakh 3 to Shrawan 2";
      case 3: return "Q3: Shrawan 3 to Kartik 2";
      case 4: return "Q4: Kartik 3 to Magh 2";
      default: return "";
    }
  };

  const calculate = async () => {
    setLoading(true);
    try {
      const fyDates = await generateFiscalYearDates(selectedFiscalYear);
      const memberTxs = transactions.filter(tx => tx.memberId === selectedMember && tx.fiscalYear === selectedFiscalYear);
      const daily = {};
      
      // Initialize all dates
      fyDates.forEach(d => {
        daily[d.dateBs] = {
          ...d,
          saving: 0,
          withdrawal: 0,
          note: "",
          balance: 0,
          interest: 0,
          totalWithInterest: 0,
          cumulativeInterest: 0
        };
      });

      // Fill in transactions and notes
      memberTxs.forEach(tx => {
        if (daily[tx.dateBs]) {
          if (tx.type === "saving") {
            daily[tx.dateBs].saving += Number(tx.amount);
            if (tx.note) {
              daily[tx.dateBs].note = daily[tx.dateBs].note 
                ? `${daily[tx.dateBs].note}; Saving: ${tx.note}` 
                : `Saving: ${tx.note}`;
            }
          }
          if (tx.type === "withdrawal") {
            daily[tx.dateBs].withdrawal += Number(tx.amount);
            if (tx.note) {
              daily[tx.dateBs].note = daily[tx.dateBs].note 
                ? `${daily[tx.dateBs].note}; Withdrawal: ${tx.note}` 
                : `Withdrawal: ${tx.note}`;
            }
          }
        }
      });

      // Calculate running balance and daily interest
      let runningBalance = 0;
      let totalInterest = 0;
      let currentQuarter = 1;
      let quarterInterest = 0;
      
      fyDates.forEach((d, index) => {
        const dayData = daily[d.dateBs];
        runningBalance += dayData.saving - dayData.withdrawal;
        dayData.balance = runningBalance;
        
        const dailyInterest = (runningBalance * savingsInterestRate) / fyDates.length;
        dayData.interest = dailyInterest;
        
        if (d.quarter !== currentQuarter) {
          currentQuarter = d.quarter;
          quarterInterest = 0;
        }
        
        quarterInterest += dailyInterest;
        totalInterest += dailyInterest;
        dayData.cumulativeInterest = quarterInterest;
        dayData.totalWithInterest = runningBalance + totalInterest;
      });

      // Filter by selected quarter if needed
      let filteredData = fyDates.map(d => daily[d.dateBs]);
      if (selectedQuarter !== "all") {
        filteredData = filteredData.filter(d => d.quarter === parseInt(selectedQuarter));
      }

      setSavingsData(filteredData);
      setError(null);
    } catch (error) {
      console.error("Error calculating savings data:", error);
      setError("Error processing savings data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async (date, type, value, note = "") => {
    if (!isAdmin) {
      setError("Only administrators can modify transactions.");
      return;
    }
    
    if (value && !validateFinancialInput(value)) {
      setError("Please enter a valid amount (positive number up to 100,000,000)");
      return;
    }
    
    const txs = transactions.filter(tx => 
      tx.memberId === selectedMember && 
      tx.dateBs === date && 
      tx.type === type && 
      tx.fiscalYear === selectedFiscalYear
    );
    
    try {
      if (!value || Number(value) === 0) {
        if (txs.length > 0) {
          await deleteDocument(txs[0].id);
        }
      } else {
        if (txs.length > 0) {
          await updateDocument(txs[0].id, { 
            amount: Number(value),
            note: note
          });
        } else {
          await addDocument({
            memberId: selectedMember,
            fiscalYear: selectedFiscalYear,
            dateBs: date,
            type,
            amount: Number(value),
            note: note
          });
        }
      }
      setSuccess("Transaction updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error updating transaction:", error);
      setError("Failed to update transaction. Please try again.");
    }
  };

  // Calculate totals
  const totalSavings = savingsData.reduce((sum, day) => sum + day.saving, 0);
  const totalWithdrawals = savingsData.reduce((sum, day) => sum + day.withdrawal, 0);
  const finalBalance = savingsData.length > 0 ? savingsData[savingsData.length - 1].balance : 0;
  const totalInterest = savingsData.reduce((sum, day) => sum + day.interest, 0);
  const finalTotalWithInterest = finalBalance + totalInterest;

  // Group data by quarter for display
  const groupedByQuarter = savingsData.reduce((acc, day) => {
    if (!acc[day.quarter]) {
      acc[day.quarter] = [];
    }
    acc[day.quarter].push(day);
    return acc;
  }, {});

  const handleExport = () => {
    if (!selectedMember || savingsData.length === 0) return;
    
    const memberName = members.find(m => m.id === selectedMember)?.name || "Member";
    const filename = `${memberName}-transactions-${selectedFiscalYear}.csv`;
    
    const exportData = savingsData.map(day => ({
      Date: day.dateBs,
      Quarter: `Q${day.quarter}`,
      Saving: day.saving,
      Withdrawal: day.withdrawal,
      Balance: day.balance,
      Interest: day.interest,
      TotalWithInterest: day.totalWithInterest,
      Notes: day.note
    }));
    
    exportToCSV(exportData, filename);
  };

  return (
    <div className="tab-content">
      <div className="page-header">
        <h1>Savings Transactions</h1>
        <div className="header-actions">
          <Button onClick={handleExport} variant="outline" disabled={!selectedMember || savingsData.length === 0}>
            <Download /> Export
          </Button>
          <div className="header-badge">
            <Calculator />
            <span>Interest Rate: {(savingsInterestRate * 100).toFixed(2)}%</span>
            {isAdmin && <span className="admin-badge">Admin</span>}
          </div>
        </div>
      </div>

      {/* Header with Dropdowns */}
      <Card>
        <CardContent>
          <div className="filter-grid">
            <div className="filter-group">
              <label>Select Member</label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <option value="">Select Member</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </Select>
            </div>
            
            <div className="filter-group">
              <label>Select Fiscal Year</label>
              <Select value={selectedFiscalYear} onValueChange={setSelectedFiscalYear}>
                {fiscalYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>
            
            <div className="filter-group">
              <label>Select Quarter</label>
              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                {quarters.map(q => (
                  <option key={q.value} value={q.value}>{q.label}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Summary Cards */}
          {selectedMember && selectedFiscalYear && (
            <div className="summary-grid">
              <Card className="summary-card green">
                <CardContent>
                  <div className="summary-label">Total Savings</div>
                  <div className="summary-value">{currency(totalSavings)}</div>
                </CardContent>
              </Card>
              
              <Card className="summary-card red">
                <CardContent>
                  <div className="summary-label">Total Withdrawals</div>
                  <div className="summary-value">{currency(totalWithdrawals)}</div>
                </CardContent>
              </Card>
              
              <Card className="summary-card blue">
                <CardContent>
                  <div className="summary-label">Final Balance</div>
                  <div className="summary-value">{currency(finalBalance)}</div>
                </CardContent>
              </Card>
              
              <Card className="summary-card amber">
                <CardContent>
                  <div className="summary-label">Total Interest</div>
                  <div className="summary-value">{currency(totalInterest)}</div>
                </CardContent>
              </Card>
              
              <Card className="summary-card purple">
                <CardContent>
                  <div className="summary-label">Total with Interest</div>
                  <div className="summary-value">{currency(finalTotalWithInterest)}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <ErrorMessage error={error} />
      <SuccessMessage success={success} />

      {/* Transactions Table */}
      {selectedMember && selectedFiscalYear && savingsData.length > 0 && (
        <Card>
          <CardContent>
            <h3>
              Transactions for {members.find(m => m.id === selectedMember)?.name || "Selected Member"} - {selectedFiscalYear}
              {selectedQuarter !== "all" && ` - ${getQuarterLabel(parseInt(selectedQuarter))}`}
            </h3>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="text-right">Saving</th>
                    <th className="text-right">Withdrawal</th>
                    <th className="text-right">Balance</th>
                    <th className="text-right">Daily Interest</th>
                    <th className="text-right">Total with Interest</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedByQuarter).map(([quarter, days]) => (
                    <React.Fragment key={quarter}>
                      <tr className="quarter-header">
                        <td colSpan={7}>
                          {getQuarterLabel(parseInt(quarter))}
                        </td>
                      </tr>
                      
                      {days.map((day) => {
                        // Get the existing transactions for this date
                        const savingTx = transactions.find(tx => 
                          tx.memberId === selectedMember && 
                          tx.dateBs === day.dateBs && 
                          tx.type === "saving" && 
                          tx.fiscalYear === selectedFiscalYear
                        );
                        
                        const withdrawalTx = transactions.find(tx => 
                          tx.memberId === selectedMember && 
                          tx.dateBs === day.dateBs && 
                          tx.type === "withdrawal" && 
                          tx.fiscalYear === selectedFiscalYear
                        );
                        
                        // Determine which note to show (prioritize saving note if both exist)
                        const displayNote = savingTx?.note || withdrawalTx?.note || "";
                        
                        return (
                          <tr key={day.dateBs}>
                            <td className="date-cell">{day.dateBs}</td>
                            
                            <td className="input-cell">
                              <Input
                                type="number"
                                value={day.saving || ''}
                                onChange={(e) => updateTransaction(day.dateBs, "saving", e.target.value, displayNote)}
                                className="text-right"
                                placeholder="0.00"
                                min="0"
                                max="100000000"
                                step="0.01"
                                disabled={!isAdmin}
                              />
                            </td>
                            
                            <td className="input-cell">
                              <Input
                                type="number"
                                value={day.withdrawal || ''}
                                onChange={(e) => updateTransaction(day.dateBs, "withdrawal", e.target.value, displayNote)}
                                className="text-right"
                                placeholder="0.00"
                                min="0"
                                max="100000000"
                                step="0.01"
                                disabled={!isAdmin}
                              />
                            </td>
                            
                            <td className="text-right amount-cell">{currency(day.balance)}</td>
                            
                            <td className="text-right interest-cell">{currency(day.interest)}</td>
                            
                            <td className="text-right total-cell">{currency(day.totalWithInterest)}</td>
                            
                            <td className="input-cell">
                              <Input
                                value={displayNote}
                                onChange={(e) => {
                                  // Update note for both saving and withdrawal transactions if they exist
                                  if (day.saving > 0) {
                                    updateTransaction(day.dateBs, "saving", day.saving, e.target.value);
                                  }
                                  if (day.withdrawal > 0) {
                                    updateTransaction(day.dateBs, "withdrawal", day.withdrawal, e.target.value);
                                  }
                                }}
                                placeholder="Transaction notes"
                                disabled={!isAdmin}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                  
                  {/* Totals Row */}
                  <tr className="totals-row">
                    <td colSpan={3}>TOTALS</td>
                    <td className="text-right balance-total">{currency(finalBalance)}</td>
                    <td className="text-right interest-total">{currency(totalInterest)}</td>
                    <td className="text-right final-total">{currency(finalTotalWithInterest)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedMember && selectedFiscalYear && savingsData.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center">
            <Calculator />
            <div>
              No transactions found for {members.find(m => m.id === selectedMember)?.name || "Selected Member"} in {selectedFiscalYear}
              {selectedQuarter !== "all" && `, ${getQuarterLabel(parseInt(selectedQuarter))}`}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent>
            <LoadingSpinner text="Calculating savings data..." />
          </CardContent>
        </Card>
      )}

      {(!selectedMember || !selectedFiscalYear) && (
        <Card>
          <CardContent className="text-center">
            <Calculator />
            <div>Please select a member and fiscal year to view transactions.</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// LoansTab Component
const LoansTab = ({ userId, isAdmin }) => {
  const { data: members } = useFirestoreData('members', userId, isAdmin);
  const { data: loans, addDocument, updateDocument, deleteDocument } = useFirestoreData('loans', userId, isAdmin);
  const { data: settingsData } = useFirestoreData('settings', userId, isAdmin);
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedFiscalYear, setSelectedFiscalYear] = useState("2081/2082");
  const [selectedQuarter, setSelectedQuarter] = useState("all");
  const [loanData, setLoanData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { generateFiscalYearDates } = useFiscalYearDates();
  const [fiscalYears] = useState(["2081/2082", "2082/2083", "2083/2084", "2084/2085", "2085/2086", "2086/2087", "2087/2088", "2088/2089", "2089/2090", "2090/2091", "2091/2092"]);

  // Get loan interest rate from settings or use default
  const loanInterestRate = useMemo(() => {
    if (settingsData && settingsData.length > 0) {
      return parseFloat(settingsData[0].loanInterestRate) / 100;
    }
    return 0.07;
  }, [settingsData]);

  const quarters = [
    { value: "all", label: "All Quarters" },
    { value: "1", label: "Q1: Magh 3 to Baisakh 2" },
    { value: "2", label: "Q2: Baisakh 3 to Shrawan 2" },
    { value: "3", label: "Q3: Shrawan 3 to Kartik 2" },
    { value: "4", label: "Q4: Kartik 3 to Magh 2" }
  ];

  useEffect(() => {
    if (selectedMember && selectedFiscalYear) {
      calculate();
    }
  }, [selectedMember, selectedFiscalYear, selectedQuarter, loans, loanInterestRate]);

  const getQuarterLabel = (quarter) => {
    switch(quarter) {
      case 1: return "Q1: Magh 3 to Baisakh 2";
      case 2: return "Q2: Baisakh 3 to Shrawan 2";
      case 3: return "Q3: Shrawan 3 to Kartik 2";
      case 4: return "Q4: Kartik 3 to Magh 2";
      default: return "";
    }
  };

  const calculate = async () => {
    setLoading(true);
    try {
      const fyDates = await generateFiscalYearDates(selectedFiscalYear);
      const memberLoans = loans.filter(tx => tx.memberId === selectedMember && tx.fiscalYear === selectedFiscalYear);
      const daily = {};

      // Initialize all dates
      fyDates.forEach(d => {
        daily[d.dateBs] = {
          ...d,
          loanTaken: 0,
          loanPaid: 0,
          interest: 0,
          interestPaid: 0,
          loanRemaining: 0,
          interestRemaining: 0
        };
      });

      // Fill in loan transactions
      memberLoans.forEach(tx => {
        if (daily[tx.dateBs]) {
          if (tx.type === "taken") daily[tx.dateBs].loanTaken += Number(tx.amount);
          if (tx.type === "paid") daily[tx.dateBs].loanPaid += Number(tx.amount);
          if (tx.type === "interestPaid") daily[tx.dateBs].interestPaid += Number(tx.amount);
        }
      });

      // Calculate running balances and daily interest
      let runningLoanBalance = 0;
      let runningInterestBalance = 0;

      fyDates.forEach((d, index) => {
        const dayData = daily[d.dateBs];
        runningLoanBalance += dayData.loanTaken - dayData.loanPaid;
        dayData.loanRemaining = runningLoanBalance;

        // Calculate daily interest using the rate from settings
        const dailyInterest = (runningLoanBalance * loanInterestRate) / 365;
        dayData.interest = dailyInterest;

        runningInterestBalance += dailyInterest - dayData.interestPaid;
        dayData.interestRemaining = runningInterestBalance;
      });

      // Filter by selected quarter if needed
      let filteredData = fyDates.map(d => daily[d.dateBs]);
      if (selectedQuarter !== "all") {
        filteredData = filteredData.filter(d => d.quarter === parseInt(selectedQuarter));
      }

      setLoanData(filteredData);
      setError(null);
    } catch (error) {
      console.error("Error calculating loan data:", error);
      setError("Error processing loan data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateLoanTransaction = async (date, type, value) => {
    if (!isAdmin) {
      setError("Only administrators can modify loan transactions.");
      return;
    }
    
    if (value && !validateFinancialInput(value)) {
      setError("Please enter a valid amount (positive number up to 100,000,000)");
      return;
    }
    
    const txs = loans.filter(tx => tx.memberId === selectedMember && tx.dateBs === date && tx.type === type && tx.fiscalYear === selectedFiscalYear);
    
    try {
      if (!value || Number(value) === 0) {
        if (txs.length > 0) {
          await deleteDocument(txs[0].id);
        }
      } else {
        if (txs.length > 0) {
          await updateDocument(txs[0].id, { amount: Number(value) });
        } else {
          await addDocument({
            memberId: selectedMember,
            fiscalYear: selectedFiscalYear,
            dateBs: date,
            type,
            amount: Number(value)
          });
        }
      }
      setSuccess("Loan transaction updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error updating loan transaction:", error);
      setError("Failed to update loan transaction. Please try again.");
    }
  };

  // Calculate totals
  const totalLoanTaken = loanData.reduce((sum, day) => sum + day.loanTaken, 0);
  const totalLoanPaid = loanData.reduce((sum, day) => sum + day.loanPaid, 0);
  const totalInterest = loanData.reduce((sum, day) => sum + day.interest, 0);
  const totalInterestPaid = loanData.reduce((sum, day) => sum + day.interestPaid, 0);
  const finalLoanRemaining = loanData.length > 0 ? loanData[loanData.length - 1].loanRemaining : 0;
  const finalInterestRemaining = loanData.length > 0 ? loanData[loanData.length - 1].interestRemaining : 0;

  // Group data by quarter for display
  const groupedByQuarter = loanData.reduce((acc, day) => {
    if (!acc[day.quarter]) {
      acc[day.quarter] = [];
    }
    acc[day.quarter].push(day);
    return acc;
  }, {});

  const handleExport = () => {
    if (!selectedMember || loanData.length === 0) return;
    
    const memberName = members.find(m => m.id === selectedMember)?.name || "Member";
    const filename = `${memberName}-loans-${selectedFiscalYear}.csv`;
    
    const exportData = loanData.map(day => ({
      Date: day.dateBs,
      Quarter: `Q${day.quarter}`,
      LoanTaken: day.loanTaken,
      LoanPaid: day.loanPaid,
      Interest: day.interest,
      InterestPaid: day.interestPaid,
      LoanRemaining: day.loanRemaining,
      InterestRemaining: day.interestRemaining
    }));
    
    exportToCSV(exportData, filename);
  };

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="text-center">
          <Users />
          <div>No members available.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="tab-content">
      <div className="page-header">
        <h1>Loan Management</h1>
        <div className="header-actions">
          <Button onClick={handleExport} variant="outline" disabled={!selectedMember || loanData.length === 0}>
            <Download /> Export
          </Button>
          <div className="header-badge">
            <CreditCard />
            <span>Interest Rate: {(loanInterestRate * 100).toFixed(2)}%</span>
            {isAdmin && <span className="admin-badge">Admin</span>}
          </div>
        </div>
      </div>

      {/* Header with Dropdowns */}
      <Card>
        <CardContent>
          <div className="filter-grid">
            <div className="filter-group">
              <label>Select Member</label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <option value="">Select Member</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </Select>
            </div>
            
            <div className="filter-group">
              <label>Select Fiscal Year</label>
              <Select value={selectedFiscalYear} onValueChange={setSelectedFiscalYear}>
                {fiscalYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>
            
            <div className="filter-group">
              <label>Select Quarter</label>
              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                {quarters.map(q => (
                  <option key={q.value} value={q.value}>{q.label}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Summary Cards */}
          {selectedMember && selectedFiscalYear && (
            <div className="summary-grid">
              <Card className="summary-card red">
                <CardContent>
                  <div className="summary-label">Total Loan Taken</div>
                  <div className="summary-value">{currency(totalLoanTaken)}</div>
                </CardContent>
              </Card>
              
              <Card className="summary-card green">
                <CardContent>
                  <div className="summary-label">Total Loan Paid</div>
                  <div className="summary-value">{currency(totalLoanPaid)}</div>
                </CardContent>
              </Card>
              
              <Card className="summary-card amber">
                <CardContent>
                  <div className="summary-label">Total Interest</div>
                  <div className="summary-value">{currency(totalInterest)}</div>
                </CardContent>
              </Card>
              
              <Card className="summary-card purple">
                <CardContent>
                  <div className="summary-label">Total Interest Paid</div>
                  <div className="summary-value">{currency(totalInterestPaid)}</div>
                </CardContent>
              </Card>
              
              <Card className="summary-card blue">
                <CardContent>
                  <div className="summary-label">Loan Remaining</div>
                  <div className="summary-value">{currency(finalLoanRemaining)}</div>
                </CardContent>
              </Card>
              
              <Card className="summary-card orange">
                <CardContent>
                  <div className="summary-label">Interest Remaining</div>
                  <div className="summary-value">{currency(finalInterestRemaining)}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <ErrorMessage error={error} />
      <SuccessMessage success={success} />

      {/* Loans Table */}
      {selectedMember && selectedFiscalYear && loanData.length > 0 && (
        <Card>
          <CardContent>
            <h3>
              Loans for {members.find(m => m.id === selectedMember)?.name || "Selected Member"} - {selectedFiscalYear}
              {selectedQuarter !== "all" && ` - ${getQuarterLabel(parseInt(selectedQuarter))}`}
            </h3>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="text-right">Loan Taken</th>
                    <th className="text-right">Loan Paid</th>
                    <th className="text-right">Loan Interest</th>
                    <th className="text-right">Interest Paid</th>
                    <th className="text-right">Loan Remaining</th>
                    <th className="text-right">Interest Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedByQuarter).map(([quarter, days]) => (
                    <React.Fragment key={quarter}>
                      <tr className="quarter-header">
                        <td colSpan={7}>
                          {getQuarterLabel(parseInt(quarter))}
                        </td>
                      </tr>
                      
                      {days.map((day) => (
                        <tr key={day.dateBs}>
                          <td className="date-cell">{day.dateBs}</td>
                          
                          <td className="input-cell">
                            <Input
                              type="number"
                              value={day.loanTaken || ''}
                              onChange={(e) => updateLoanTransaction(day.dateBs, "taken", e.target.value)}
                              className="text-right"
                              placeholder="0.00"
                              min="0"
                              max="100000000"
                              step="0.01"
                              disabled={!isAdmin}
                            />
                          </td>
                          
                          <td className="input-cell">
                            <Input
                              type="number"
                              value={day.loanPaid || ''}
                              onChange={(e) => updateLoanTransaction(day.dateBs, "paid", e.target.value)}
                              className="text-right"
                              placeholder="0.00"
                              min="0"
                              max="100000000"
                              step="0.01"
                              disabled={!isAdmin}
                            />
                          </td>
                          
                          <td className="text-right interest-cell">{currency(day.interest)}</td>
                          
                          <td className="input-cell">
                            <Input
                              type="number"
                              value={day.interestPaid || ''}
                              onChange={(e) => updateLoanTransaction(day.dateBs, "interestPaid", e.target.value)}
                              className="text-right"
                              placeholder="0.00"
                              min="0"
                              max="100000000"
                              step="0.01"
                              disabled={!isAdmin}
                            />
                          </td>
                          
                          <td className="text-right loan-remaining-cell">{currency(day.loanRemaining)}</td>
                          
                          <td className="text-right interest-remaining-cell">{currency(day.interestRemaining)}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                  
                  {/* Totals Row */}
                  <tr className="totals-row">
                    <td>TOTALS</td>
                    <td className="text-right loan-taken-total">{currency(totalLoanTaken)}</td>
                    <td className="text-right loan-paid-total">{currency(totalLoanPaid)}</td>
                    <td className="text-right interest-total">{currency(totalInterest)}</td>
                    <td className="text-right interest-paid-total">{currency(totalInterestPaid)}</td>
                    <td className="text-right loan-remaining-total">{currency(finalLoanRemaining)}</td>
                    <td className="text-right interest-remaining-total">{currency(finalInterestRemaining)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedMember && selectedFiscalYear && loanData.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center">
            <CreditCard />
            <div>
              No loans found for {members.find(m => m.id === selectedMember)?.name || "Selected Member"} in {selectedFiscalYear}
              {selectedQuarter !== "all" && `, ${getQuarterLabel(parseInt(selectedQuarter))}`}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent>
            <LoadingSpinner text="Calculating loan data..." />
          </CardContent>
        </Card>
      )}

      {(!selectedMember || !selectedFiscalYear) && (
        <Card>
          <CardContent className="text-center">
            <CreditCard />
            <div>Please select a member and fiscal year to view loans.</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// GroupTransactionsTab Component
const GroupTransactionsTab = ({ userId, isAdmin }) => {
  const { data: transactions, addDocument, deleteDocument } = useFirestoreData('groupTransactions', userId, isAdmin);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState("2081/2082");
  const [dateBs, setDateBs] = useState("");
  const [cashIn, setCashIn] = useState("");
  const [cashOut, setCashOut] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fiscalYears] = useState(["2081/2082", "2082/2083", "2083/2084", "2084/2085", "2085/2086", "2086/2087", "2087/2088", "2088/2089", "2089/2090", "2090/2091", "2091/2092"]);

  const addTransaction = async () => {
    if (!isAdmin) {
      setError("Only administrators can add group transactions.");
      return;
    }
    
    if (!dateBs || !isValidBSDate(dateBs)) {
      setError("Please enter a valid date in YYYY-MM-DD format.");
      return;
    }
    
    if (!cashIn && !cashOut) {
      setError("Please enter either Cash In or Cash Out amount.");
      return;
    }
    
    if ((cashIn && !validateFinancialInput(cashIn)) || (cashOut && !validateFinancialInput(cashOut))) {
      setError("Please enter a valid amount (positive number up to 100,000,000)");
      return;
    }
    
    const amount = cashIn ? Number(cashIn) : Number(cashOut);
    const type = cashIn ? "in" : "out";
    
    setLoading(true);
    try {
      await addDocument({
        dateBs,
        type,
        amount,
        note,
        fiscalYear: selectedFiscalYear
      });
      
      setDateBs("");
      setCashIn("");
      setCashOut("");
      setNote("");
      setError(null);
      setSuccess("Transaction added successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error adding group transaction:", error);
      setError("Failed to add group transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id) => {
    if (!isAdmin) {
      setError("Only administrators can delete group transactions.");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    
    setLoading(true);
    try {
      await deleteDocument(id);
      setError(null);
      setSuccess("Transaction deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error deleting group transaction:", error);
      setError("Failed to delete group transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => t.fiscalYear === selectedFiscalYear);
  }, [transactions, selectedFiscalYear]);

  const handleExport = () => {
    if (filteredTransactions.length === 0) return;
    
    const filename = `group-transactions-${selectedFiscalYear}.csv`;
    exportToCSV(filteredTransactions, filename);
  };

  // Calculate running balance
  let runningBalance = 0;
  const transactionsWithBalance = filteredTransactions.map(t => {
    runningBalance += t.type === "in" ? t.amount : -t.amount;
    return { ...t, balance: runningBalance };
  });

  const totalCashIn = filteredTransactions.filter(t => t.type === "in").reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalCashOut = filteredTransactions.filter(t => t.type === "out").reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const finalBalance = runningBalance;

  return (
    <div className="tab-content">
      <div className="page-header">
        <h1>Group Transactions</h1>
        <div className="header-actions">
          <Button onClick={handleExport} variant="outline" disabled={filteredTransactions.length === 0}>
            <Download /> Export
          </Button>
          <div className="header-badge">
            <FileText />
            <span>{filteredTransactions.length} Transactions</span>
            {isAdmin && <span className="admin-badge">Admin</span>}
          </div>
        </div>
      </div>

      <ErrorMessage error={error} />
      <SuccessMessage success={success} />

      {isAdmin && (
        <Card>
          <CardContent>
            <h2>Add Group Transaction</h2>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Select Fiscal Year</label>
                <Select value={selectedFiscalYear} onValueChange={setSelectedFiscalYear}>
                  {fiscalYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Date (BS)</label>
                <Input
                  value={dateBs}
                  onChange={e => setDateBs(e.target.value)}
                  placeholder="YYYY-MM-DD"
                />
              </div>
              
              <div className="form-group">
                <label>Cash In</label>
                <Input
                  type="number"
                  value={cashIn}
                  onChange={e => { setCashIn(e.target.value); setCashOut(""); }}
                  placeholder="0.00"
                  min="0"
                  max="100000000"
                  step="0.01"
                />
              </div>
              
              <div className="form-group">
                <label>Cash Out</label>
                <Input
                  type="number"
                  value={cashOut}
                  onChange={e => { setCashOut(e.target.value); setCashIn(""); }}
                  placeholder="0.00"
                  min="0"
                  max="100000000"
                  step="0.01"
                />
              </div>
              
              <div className="form-group">
                <label>Note</label>
                <Input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Transaction note"
                />
              </div>
              
              <div className="form-group">
                <label>&nbsp;</label>
                <Button 
                  onClick={addTransaction} 
                  disabled={loading}
                  className="form-btn"
                >
                  {loading ? <Loader2 /> : <Plus />}
                  Add Transaction
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredTransactions.length > 0 && (
        <Card>
          <CardContent>
            <div className="data-header">
              <h3>Group Transactions - {selectedFiscalYear}</h3>
            </div>
            
            {/* Summary Cards */}
            <div className="summary-grid">
              <Card className="summary-card green">
                <CardContent>
                  <div className="summary-label">Total Cash In</div>
                  <div className="summary-value">{currency(totalCashIn)}</div>
                </CardContent>
              </Card>
              
              <Card className="summary-card red">
                <CardContent>
                  <div className="summary-label">Total Cash Out</div>
                  <div className="summary-value">{currency(totalCashOut)}</div>
                </CardContent>
              </Card>
              
              <Card className="summary-card blue">
                <CardContent>
                  <div className="summary-label">Final Balance</div>
                  <div className="summary-value">{currency(finalBalance)}</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="text-right">Cash In</th>
                    <th className="text-right">Cash Out</th>
                    <th>Note</th>
                    <th className="text-right">Balance</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {transactionsWithBalance.map(t => (
                    <tr key={t.id}>
                      <td className="date-cell">{t.dateBs}</td>
                      
                      <td className="text-right cash-in-cell">
                        {t.type === "in" ? currency(t.amount) : "-"}
                      </td>
                      
                      <td className="text-right cash-out-cell">
                        {t.type === "out" ? currency(t.amount) : "-"}
                      </td>
                      
                      <td className="note-cell">{t.note || "-"}</td>
                      
                      <td className="text-right balance-cell">{currency(t.balance)}</td>
                      
                      {isAdmin && (
                        <td className="action-cell">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteTransaction(t.id)}
                            disabled={loading}
                          >
                            <Trash2 />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredTransactions.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center">
            <FileText />
            <div>No group transactions found for {selectedFiscalYear}.</div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent>
            <LoadingSpinner text="Processing transaction..." />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ProfileTab Component - ALTERNATIVE FIX
const ProfileTab = ({ userId, user, userRole, onUserUpdate }) => {
  const { data: users, loading, error: firestoreError, updateDocument } = useFirestoreData('users', userId, userRole === 'admin');
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState(null); // Now we can use error and setError
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // ... rest of the component remains the same using error and setError

  return (
    <div className="tab-content">
      {/* ... */}
      <ErrorMessage error={error || firestoreError} /> {/* Show both local and Firestore errors */}
      {/* ... */}
    </div>
  );
};

// SettingsTab Component - UPDATED WITH ADMIN MANAGEMENT SECTION
const SettingsTab = ({ userId, isAdmin }) => {
  const { data: settings, addDocument, updateDocument } = useFirestoreData('settings', userId, isAdmin);
  const [formData, setFormData] = useState({
    savingsInterestRate: 5.00,
    loanInterestRate: 7.50,
    fiscalYearStart: "2081/2082",
    currencySymbol: "Rs.",
    dateFormat: "YYYY-MM-DD",
    backupFrequency: "monthly"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeSection, setActiveSection] = useState("general");
  const [fiscalYears, setFiscalYears] = useState(["2081/2082", "2082/2083", "2083/2084", "2084/2085", "2085/2086", "2086/2087", "2087/2088", "2088/2089", "2089/2090", "2090/2091", "2091/2092"]);
  const [newFiscalYear, setNewFiscalYear] = useState("");

  const dateFormats = ["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY", "YYYY/MM/DD"];
  const backupFrequencies = ["daily", "weekly", "monthly", "quarterly", "yearly"];

  useEffect(() => {
    if (settings && settings.length > 0) {
      setFormData(settings[0]);
    }
  }, [settings]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const saveSettings = async () => {
    if (!isAdmin) {
      setError("Only administrators can modify settings.");
      return;
    }
    
    setLoading(true);
    try {
      // Validate inputs
      if (isNaN(parseFloat(formData.savingsInterestRate)) || parseFloat(formData.savingsInterestRate) < 0) {
        setError("Savings interest rate must be a positive number.");
        setLoading(false);
        return;
      }

      if (isNaN(parseFloat(formData.loanInterestRate)) || parseFloat(formData.loanInterestRate) < 0) {
        setError("Loan interest rate must be a positive number.");
        setLoading(false);
        return;
      }

      if (settings && settings.length > 0) {
        await updateDocument(settings[0].id, formData);
      } else {
        await addDocument(formData);
      }

      setSuccess("Settings saved successfully!");
      setLoading(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      setError("Failed to save settings. Please try again.");
      setLoading(false);
    }
  };

  const addFiscalYear = () => {
    if (!isAdmin) {
      setError("Only administrators can add fiscal years.");
      return;
    }
    
    if (!newFiscalYear || !/^\d{4}\/\d{4}$/.test(newFiscalYear)) {
      setError("Please enter a valid fiscal year in YYYY/YYYY format.");
      return;
    }
    if (fiscalYears.includes(newFiscalYear)) {
      setError("Fiscal year already exists.");
      return;
    }

    const updatedFiscalYears = [...fiscalYears, newFiscalYear];
    setFiscalYears(updatedFiscalYears);
    setNewFiscalYear("");
    setSuccess("Fiscal year added successfully!");
  };

  const deleteFiscalYear = (fy) => {
    if (!isAdmin) {
      setError("Only administrators can delete fiscal years.");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete fiscal year ${fy}?`)) return;

    const updatedFiscalYears = fiscalYears.filter(y => y !== fy);
    setFiscalYears(updatedFiscalYears);
    setSuccess("Fiscal year deleted successfully!");
  };

  const exportData = async () => {
    try {
      // Get all data from Firestore
      const collections = ['members', 'transactions', 'loans', 'groupTransactions', 'settings'];
      const allData = {};

      for (const collectionName of collections) {
        const q = query(collection(db, collectionName));
        const querySnapshot = await getDocs(q);
        allData[collectionName] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      allData.fiscalYears = fiscalYears;

      const dataStr = JSON.stringify(allData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

      const exportFileDefaultName = `besties-saving-backup-${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      setSuccess("Data exported successfully!");
    } catch (error) {
      console.error("Error exporting data:", error);
      setError("Failed to export data. Please try again.");
    }
  };

  const importData = (e) => {
    if (!isAdmin) {
      setError("Only administrators can import data.");
      return;
    }
    
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);

        // Validate the imported data structure
        if (typeof data !== 'object') {
          throw new Error("Invalid file format");
        }

        // Import data to Firestore
        for (const collectionName of ['members', 'transactions', 'loans', 'groupTransactions', 'settings']) {
          if (data[collectionName]) {
            // Delete existing data
            const q = query(collection(db, collectionName));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(async (doc) => {
              await deleteDoc(doc.ref);
            });

            // Add imported data
            for (const item of data[collectionName]) {
              await addDoc(collection(db, collectionName), {
                ...item
              });
            }
          }
        }

        if (data.fiscalYears) {
          setFiscalYears(data.fiscalYears);
        }

        setSuccess("Data imported successfully! The page will reload.");

        // Reload the application after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error("Error importing data:", error);
        setError("Failed to import data. The file may be corrupted or in an invalid format.");
      }
    };
    reader.readAsText(file);
  };

  const resetData = async () => {
    if (!isAdmin) {
      setError("Only administrators can reset data.");
      return;
    }
    
    if (!window.confirm("Are you sure you want to reset all data? This action cannot be undone.")) return;

    try {
      // Clear all data from Firestore
      const collections = ['members', 'transactions', 'loans', 'groupTransactions', 'settings'];

      for (const collectionName of collections) {
        const q = query(collection(db, collectionName));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
      }

      setFiscalYears(["2081/2082", "2082/2083", "2083/2084", "2084/2085", "2085/2086", "2086/2087", "2087/2088", "2088/2089", "2089/2090", "2090/2091", "2091/2092"]);
      setSuccess("All data has been reset. The page will reload.");

      // Reload the application after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error resetting data:", error);
      setError("Failed to reset data. Please try again.");
    }
  };

  // ADD THE ADMIN MANAGEMENT COMPONENT HERE
  const AdminManagement = () => {
    const { data: admins, loading: adminsLoading, error: adminsError, addDocument: addAdminDoc, deleteDocument: deleteAdminDoc } = useFirestoreData('admins', userId, isAdmin);
    const { data: users } = useFirestoreData('users', userId, isAdmin);
    const [adminEmail, setAdminEmail] = useState("");
    const [adminError, setAdminError] = useState(null);
    const [adminSuccess, setAdminSuccess] = useState(null);

    const addAdmin = async () => {
      if (!adminEmail) {
        setAdminError("Please enter an email address.");
        return;
      }

      // Find user by email
      const userToAdd = users.find(u => u.email === adminEmail);
      if (!userToAdd) {
        setAdminError("User with this email does not exist.");
        return;
      }

      // Check if already an admin
      const isAlreadyAdmin = admins.some(a => a.userId === userToAdd.uid);
      if (isAlreadyAdmin) {
        setAdminError("This user is already an administrator.");
        return;
      }

      try {
        await addAdminDoc({
          userId: userToAdd.uid,
          email: userToAdd.email,
          fullName: userToAdd.fullName,
          addedBy: userId,
          addedAt: serverTimestamp()
        });
        
        setAdminEmail("");
        setAdminError(null);
        setAdminSuccess("Administrator added successfully!");
        setTimeout(() => setAdminSuccess(null), 3000);
      } catch (err) {
        setAdminError(err.message);
      }
    };

    const removeAdmin = async (adminId, adminEmail) => {
      if (!window.confirm(`Are you sure you want to remove administrator privileges from ${adminEmail}?`)) return;
      
      try {
        await deleteAdminDoc(adminId);
        setAdminError(null);
        setAdminSuccess("Administrator removed successfully!");
        setTimeout(() => setAdminSuccess(null), 3000);
      } catch (err) {
        setAdminError(err.message);
      }
    };

    if (adminsLoading) return <LoadingSpinner text="Loading administrators..." />;

    return (
      <div className="admin-management">
        <ErrorMessage error={adminsError || adminError} />
        <SuccessMessage success={adminSuccess} />

        <Card className="form-card">
          <CardContent>
            <h3>Add New Administrator</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>User Email</label>
                <Input 
                  type="email"
                  value={adminEmail} 
                  onChange={e => setAdminEmail(e.target.value)} 
                  placeholder="Enter user's email address"
                  icon={<Mail />}
                />
              </div>
              <Button onClick={addAdmin} className="form-btn">
                <Plus /> Add Administrator
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="data-card">
          <CardContent>
            <div className="data-header">
              <h3>Current Administrators</h3>
              <div className="header-badge">
                <span>{admins.length} Administrators</span>
              </div>
            </div>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Added On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="no-data">
                        <Users />
                        <div>No administrators found.</div>
                      </td>
                    </tr>
                  ) : (
                    admins.map(admin => (
                      <tr key={admin.id}>
                        <td>
                          <div className="data-value">{admin.fullName || "Unknown"}</div>
                        </td>
                        <td>
                          <div className="data-value">{admin.email}</div>
                        </td>
                        <td>
                          <div className="data-value">
                            {admin.addedAt ? new Date(admin.addedAt.seconds * 1000).toLocaleDateString() : "Unknown"}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => removeAdmin(admin.id, admin.email)}
                              disabled={admin.userId === userId} // Can't remove yourself
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // UPDATE SECTIONS TO INCLUDE ADMIN MANAGEMENT
  const sections = [
    { id: "general", label: "General Settings", icon: <SettingsIcon /> },
    { id: "fiscal", label: "Fiscal Years", icon: <Calendar /> },
    { id: "data", label: "Data Management", icon: <DatabaseIcon /> },
    { id: "admins", label: "Admin Management", icon: <ShieldIcon /> },
    { id: "security", label: "Security", icon: <ShieldIcon /> },
    { id: "about", label: "About", icon: <InfoIcon /> },
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case "general":
        return (
          <div className="settings-section">
            <h3>General Application Settings</h3>
            <div className="settings-grid">
              <div className="setting-group">
                <label>Savings Interest Rate (%)</label>
                <Input
                  type="number"
                  name="savingsInterestRate"
                  value={formData.savingsInterestRate}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  max="100"
                  disabled={!isAdmin}
                />
              </div>

              <div className="setting-group">
                <label>Loan Interest Rate (%)</label>
                <Input
                  type="number"
                  name="loanInterestRate"
                  value={formData.loanInterestRate}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  max="100"
                  disabled={!isAdmin}
                />
              </div>

              <div className="setting-group">
                <label>Default Fiscal Year</label>
                <Select
                  name="fiscalYearStart"
                  value={formData.fiscalYearStart}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, fiscalYearStart: value }))}
                  disabled={!isAdmin}
                >
                  {fiscalYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Select>
              </div>

              <div className="setting-group">
                <label>Currency Symbol</label>
                <Input
                  type="text"
                  name="currencySymbol"
                  value={formData.currencySymbol}
                  onChange={handleInputChange}
                  maxLength="5"
                  disabled={!isAdmin}
                />
              </div>

              <div className="setting-group">
                <label>Date Format</label>
                <Select
                  name="dateFormat"
                  value={formData.dateFormat}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, dateFormat: value }))}
                  disabled={!isAdmin}
                >
                  {dateFormats.map(format => (
                    <option key={format} value={format}>{format}</option>
                  ))}
                </Select>
              </div>

              <div className="setting-group">
                <label>Auto Backup Frequency</label>
                <Select
                  name="backupFrequency"
                  value={formData.backupFrequency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, backupFrequency: value }))}
                  disabled={!isAdmin}
                >
                  {backupFrequencies.map(freq => (
                    <option key={freq} value={freq}>{freq.charAt(0).toUpperCase() + freq.slice(1)}</option>
                  ))}
                </Select>
              </div>
            </div>

            {isAdmin && (
              <Button onClick={saveSettings} disabled={loading} className="save-btn">
                {loading ? <Loader2 /> : <SaveIcon />}
                Save Settings
              </Button>
            )}
          </div>
        );

      case "fiscal":
        return (
          <div className="settings-section">
            <h3>Fiscal Years Management</h3>
            {isAdmin && (
              <div className="form-grid">
                <div className="form-group">
                  <label>New Fiscal Year (YYYY/YYYY)</label>
                  <Input
                    value={newFiscalYear}
                    onChange={e => setNewFiscalYear(e.target.value)}
                    placeholder="e.g., 2086/2087"
                  />
                </div>
                <Button onClick={addFiscalYear} className="form-btn">
                  <Plus /> Add Fiscal Year
                </Button>
              </div>
            )}
            <div className="detail-list">
              {fiscalYears.map(fy => (
                <div key={fy} className="list-item">
                  <span className="item-name">{fy}</span>
                  {isAdmin && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => deleteFiscalYear(fy)}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "data":
        return (
          <div className="settings-section">
            <h3>Data Management</h3>
            <div className="data-actions">
              <Card className="data-card">
                <CardContent>
                  <h4>Export Data</h4>
                  <p>Download a backup of all your data for safekeeping or migration.</p>
                  <Button onClick={exportData} variant="outline">
                    <DownloadIcon /> Export All Data
                  </Button>
                </CardContent>
              </Card>

              {isAdmin && (
                <>
                  <Card className="data-card">
                    <CardContent>
                      <h4>Import Data</h4>
                      <p>Restore from a previously exported backup file.</p>
                      <div className="file-input-wrapper">
                        <Button as="label" variant="outline" htmlFor="import-file">
                          <UploadIcon /> Choose File
                        </Button>
                        <input
                          type="file"
                          id="import-file"
                          accept=".json"
                          onChange={importData}
                          style={{ display: 'none' }}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="data-card warning">
                    <CardContent>
                      <h4>Reset Data</h4>
                      <p>Clear all data and restore to factory settings. This action cannot be undone.</p>
                      <Button onClick={resetData} variant="destructive">
                        <TrashIcon /> Reset All Data
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        );

      // ADD THE ADMIN MANAGEMENT SECTION HERE
      case "admins":
        return (
          <div className="settings-section">
            <h3>Administrator Management</h3>
            {isAdmin ? (
              <AdminManagement />
            ) : (
              <Card>
                <CardContent className="text-center">
                  <ShieldIcon />
                  <div>Only administrators can access this section.</div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "security":
        return (
          <div className="settings-section">
            <h3>Security Settings</h3>
            <div className="settings-grid">
              <div className="setting-group">
                <label>Auto Logout After Inactivity</label>
                <select className="select" defaultValue="30" disabled={!isAdmin}>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="0">Never</option>
                </select>
              </div>

              <div className="setting-group">
                <label>Password Requirements</label>
                <select className="select" defaultValue="medium" disabled={!isAdmin}>
                  <option value="low">Low (6+ characters)</option>
                  <option value="medium">Medium (8+ characters, letters and numbers)</option>
                  <option value="high">High (10+ characters, mixed case, numbers, symbols)</option>
                </select>
              </div>

              <div className="setting-group">
                <label>Two-Factor Authentication</label>
                <select className="select" defaultValue="disabled" disabled={!isAdmin}>
                  <option value="disabled">Disabled</option>
                  <option value="enabled">Enabled (Recommended)</option>
                </select>
              </div>
            </div>

            {isAdmin && (
              <Button onClick={saveSettings} disabled={loading}>
                {loading ? <Loader2 /> : <SaveIcon />}
                Save Security Settings
              </Button>
            )}
          </div>
        );

      case "about":
        return (
          <div className="settings-section">
            <h3>About The Besties Saving</h3>
            <Card>
              <CardContent>
                <div className="about-content">
                  <div className="app-info">
                    <h4>Application Information</h4>
                    <p><strong>Version:</strong> 1.0.0</p>
                    <p><strong>Last Updated:</strong> August 26, 2025</p>
                    <p><strong>License:</strong> Besties License</p>
                  </div>

                  <div className="system-info">
                    <h4>System Information</h4>
                    <p><strong>Browser:</strong> {navigator.userAgent.split(') ')[0].split(' (')[1]}</p>
                    <p><strong>Screen Resolution:</strong> {window.screen.width}x{window.screen.height}</p>
                    <p><strong>User ID:</strong> {userId}</p>
                    <p><strong>User Role:</strong> {isAdmin ? "Administrator" : "User"}</p>
                  </div>

                  <div className="support-info">
                    <h4>Support</h4>
                    <p>For support inquiries, please contact:</p>
                    <p><strong>Email:</strong> bestiessaving1@gmail.com</p>
                    <p><strong>Phone:</strong> 9860022437, 9843132797, 9843767788, 9843662707</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return <div>Select a settings category</div>;
    }
  };

  return (
    <div className="tab-content">
      <div className="page-header">
        <h1>Application Settings</h1>
        <div className="header-badge">
          <SettingsIcon />
          <span>Configuration</span>
          {isAdmin && <span className="admin-badge">Admin</span>}
        </div>
      </div>

      <ErrorMessage error={error} />
      <SuccessMessage success={success} />

      <div className="settings-container">
        <div className="settings-sidebar">
          {sections.map(section => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "secondary" : "ghost"}
              className="settings-nav-btn"
              onClick={() => setActiveSection(section.id)}
            >
              {section.icon}
              {section.label}
            </Button>
          ))}
        </div>

        <div className="settings-content">
          {renderSectionContent()}
        </div>
      </div>
    </div>
  );
};

// Main App Component - FIXED PROFILE TAB PASSING
const App = ({ user, onLogout, userRole, onUserUpdate }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userName, setUserName] = useState(user.displayName || "");
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (window.location.pathname !== '/dashboard') {
      window.history.replaceState(null, '', '/dashboard');
    }
  }, []);

  useEffect(() => {
    if (user.displayName) setUserName(user.displayName);
  }, [user.displayName]);

  const handleUserUpdate = (updatedUser) => {
    setUserName(updatedUser.displayName || "");
    if (onUserUpdate) onUserUpdate(updatedUser);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard userId={user.uid} isAdmin={isAdmin} userName={userName} />;
      case 'members': return <MembersTab userId={user.uid} isAdmin={isAdmin} />;
      case 'transactions': return <TransactionsTab userId={user.uid} isAdmin={isAdmin} />;
      case 'loans': return <LoansTab userId={user.uid} isAdmin={isAdmin} />;
      case 'groupTransactions': return <GroupTransactionsTab userId={user.uid} isAdmin={isAdmin} />;
      case 'profile': return <ProfileTab userId={user.uid} user={user} userRole={userRole} onUserUpdate={handleUserUpdate} />;
      case 'settings': return <SettingsTab userId={user.uid} isAdmin={isAdmin} />;
      default: return <Dashboard userId={user.uid} isAdmin={isAdmin} userName={userName} />;
    }
  };

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>
            <Wallet />
            The Besties Saving
          </h1>
          <div className="user-info">
            <User />
            <div>
              <div className="user-name">{userName || user.email}</div>
              <div className="user-email">{user.email}</div>
              {isAdmin && <span className="admin-badge">Admin</span>}
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Button variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('dashboard')}><BarChart3 /> Dashboard</Button>
          <Button variant={activeTab === 'members' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('members')}><Users /> Members</Button>
          <Button variant={activeTab === 'transactions' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('transactions')}><Calculator /> Transactions</Button>
          <Button variant={activeTab === 'loans' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('loans')}><CreditCard /> Loans</Button>
          <Button variant={activeTab === 'groupTransactions' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('groupTransactions')}><FileText /> Group Transactions</Button>
          <Button variant={activeTab === 'profile' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('profile')}><User /> Profile</Button>
          <Button variant={activeTab === 'settings' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('settings')}><SettingsIcon /> Settings</Button>
        </nav>

        <Button variant="destructive" onClick={onLogout}><LogOut /> Logout</Button>
      </div>

      <div className="main-content">{renderTabContent()}</div>
    </div>
  );
};

// Root Component - FIXED AUTH & PROFILE
const Root = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("user");
  const [loading, setLoading] = useState(true);

  const checkIfUserIsAdmin = async (userId) => {
    try {
      const adminDoc = await getDocs(query(collection(db, "admins"), where("userId", "==", userId)));
      return !adminDoc.empty;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  };

  const getUserDetails = async (userId) => {
    try {
      const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", userId)));
      if (!userDoc.empty) return userDoc.docs[0].data();
      return null;
    } catch (error) {
      console.error("Error fetching user details:", error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const isAdmin = await checkIfUserIsAdmin(user.uid);
        const userDetails = await getUserDetails(user.uid);

        const userWithDetails = {
          ...user,
          displayName: userDetails?.fullName || user.displayName || ""
        };

        setIsAuthenticated(true);
        setUser(userWithDetails);
        setUserRole(isAdmin ? "admin" : "user");
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setUserRole("user");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUserUpdate = (updatedUser) => setUser(updatedUser);
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setUserRole("user");
  };

  if (loading) return <LoadingSpinner text="Checking authentication..." />;

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated
              ? <Navigate to="/dashboard" replace />
              : <LoginPage setIsAuthenticated={setIsAuthenticated} setUser={setUser} setUserRole={setUserRole} />
          }
        />
        <Route
          path="/dashboard/*"
          element={
            isAuthenticated
              ? <App user={user} onLogout={handleLogout} userRole={userRole} onUserUpdate={handleUserUpdate} />
              : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </Router>
  );
};

export default Root;
