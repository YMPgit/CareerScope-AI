export function formatDate(value?: string | null): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return value
  }
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

export function initials(name?: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function truncate(text: string | null | undefined, max = 140): string {
  if (!text) return ''
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
}

export function percent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${Math.round(value)}%`
}

export function stageLabel(stage: string | null | undefined): string {
  const labels: Record<string, string> = {
    queued: 'Queued your analysis',
    manager: 'Initializing',
    resume_analyzer: 'Analyzing your resume',
    job_market: 'Searching live jobs on Google Jobs',
    skill_intelligence: 'Extracting market skill demand',
    skill_gap: 'Comparing your skills with the market',
    career_planner: 'Building your career roadmap',
    insight: 'Writing your personalized report',
    persist: 'Saving your results',
    completed: 'Analysis complete',
    failed: 'Analysis failed',
  }
  return labels[stage || ''] || stage || 'Processing'
}

export const WORK_MODES = ['Any', 'Remote', 'Hybrid', 'On-site']
export const EXPERIENCE_LEVELS = ['Any', 'Fresher', 'Entry Level', 'Mid Level', 'Senior']
export const ROLE_SUGGESTIONS = [
  // Data & analytics
  'Data Analyst',
  'Business Analyst',
  'Data Scientist',
  'ML Engineer',
  'Machine Learning Engineer',
  'Data Engineer',
  'BI Developer',
  'Business Intelligence Analyst',
  'Analytics Engineer',
  'AI Engineer',
  'MLOps Engineer',
  'Data Architect',
  'Quantitative Analyst',
  'Statistician',
  'Research Analyst',
  'Product Analyst',
  'Marketing Analyst',
  'Financial Analyst',
  'Operations Analyst',
  'Supply Chain Analyst',
  'Risk Analyst',
  'Credit Analyst',
  'Investment Analyst',
  'Portfolio Analyst',
  // Software & engineering
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Full Stack Engineer',
  'React Developer',
  'Node.js Developer',
  'Python Developer',
  'Java Developer',
  'Go Developer',
  'Ruby on Rails Developer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'Cloud Engineer',
  'AWS Engineer',
  'Azure Engineer',
  'Platform Engineer',
  'Systems Engineer',
  'Network Engineer',
  'Security Engineer',
  'Cybersecurity Analyst',
  "Pentester / Ethical Hacker",
  'Mobile Developer',
  'Android Developer',
  'iOS Developer',
  'Flutter Developer',
  'Game Developer',
  'Embedded Systems Engineer',
  'QA Engineer',
  'SDET',
  'Automation Tester',
  'Database Administrator',
  'Solutions Architect',
  'Software Architect',
  'Technical Lead',
  'Engineering Manager',
  'Scrum Master',
  // Product & design
  'Product Manager',
  'Product Owner',
  'UX Designer',
  'UI Designer',
  'Product Designer',
  'UX Researcher',
  'Graphic Designer',
  'Motion Designer',
  '3D Artist',
  'Technical Writer',
  'Design Engineer',
  'Growth Product Manager',
  // Marketing & content
  'Digital Marketing Specialist',
  'SEO Specialist',
  'SEM / PPC Specialist',
  'Performance Marketer',
  'Marketing Manager',
  'Brand Manager',
  'Content Marketing Manager',
  'Content Writer',
  'Copywriter',
  'Social Media Manager',
  'Email Marketing Specialist',
  'Growth Marketer',
  'Community Manager',
  'Public Relations Specialist',
  // Sales & business
  'Sales Development Representative',
  'Account Executive',
  'Account Manager',
  'Sales Manager',
  'Business Development Executive',
  'Business Development Manager',
  'Customer Success Manager',
  'Key Account Manager',
  'Inside Sales Executive',
  'Salesforce Administrator',
  'Salesforce Developer',
  'Pre-Sales Consultant',
  // HR & operations
  'HR Executive',
  'HR Generalist',
  'HR Business Partner',
  'Talent Acquisition Specialist',
  'Recruiter',
  'Operations Manager',
  'Project Manager',
  'Program Manager',
  'Delivery Manager',
  'Administrative Assistant',
  'Executive Assistant',
  // Finance & accounting
  'Accountant',
  'Auditor',
  'Financial Controller',
  'Tax Consultant',
  'Investment Banker',
  'Financial Planner',
  'Bookkeeper',
  'Payroll Specialist',
  // Healthcare & science
  'Registered Nurse',
  'Medical Coder',
  'Medical Scribe',
  'Clinical Research Associate',
  'Pharmacist',
  'Biomedical Engineer',
  'Laboratory Technician',
  'Bioinformatics Analyst',
  // Emerging & niche
  'Blockchain Developer',
  'Web3 Developer',
  'Cloud Security Engineer',
  'Data Privacy Specialist',
  'Prompt Engineer',
  'Computer Vision Engineer',
  'NLP Engineer',
  'Robotics Engineer',
  'Automation Engineer',
  'IoT Engineer',
]
export const LOCATION_SUGGESTIONS: string[] = [...new Set([
  // Major metros
  'Mumbai', 'Delhi', 'New Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
  // Others (state-wise)
  'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna',
  'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Varanasi', 'Srinagar',
  'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur',
  'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Chandigarh', 'Guwahati', 'Solapur',
  'Hubballi', 'Tiruchirappalli', 'Bareilly', 'Mysuru', 'Tiruppur', 'Gurugram', 'Noida', 'Greater Noida',
  'Salem', 'Aligarh', 'Moradabad', 'Jalandhar', 'Bhubaneswar', 'Warangal', 'Guntur', 'Bhiwandi', 'Saharanpur',
  'Gorakhpur', 'Bikaner', 'Amravati', 'Jamshedpur', 'Bhilai', 'Cuttack', 'Firozabad', 'Kochi', 'Bhavnagar',
  'Dehradun', 'Durgapur', 'Asansol', 'Rourkela', 'Nanded', 'Kolhapur', 'Ajmer', 'Akola', 'Gulbarga', 'Jamnagar',
  'Ujjain', 'Loni', 'Siliguri', 'Jhansi', 'Ulhasnagar', 'Jammu', 'Sangli', 'Mangaluru', 'Erode', 'Nellore',
  'Tirunelveli', 'Vellore', 'Thrissur', 'Kozhikode', 'Kollam', 'Thiruvananthapuram', 'Kannur', 'Malappuram',
  'Puducherry', 'Panaji', 'Shimla', 'Gangtok', 'Itanagar', 'Kohima', 'Imphal', 'Aizawl', 'Agartala', 'Shillong',
  'Leh', 'Dimapur', 'Port Blair', 'Daman', 'Diu', 'Silvassa',
  'Belagavi', 'Davangere', 'Ballari', 'Kolar', 'Shivamogga', 'Mangalore', 'Tumakuru', 'Bidar',
  'Anantapur', 'Kakinada', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Kadapa', 'Ongole',
  'Bathinda', 'Pathankot', 'Patiala', 'Hoshiarpur', 'Mohali', 'Panchkula', 'Ambala', 'Karnal',
  'Fatehpur', 'Mathura', 'Alwar', 'Sikar', 'Bharatpur', 'Udaipur', 'Pali', 'Tonk',
  'Gandhinagar', 'Anand', 'Nadiad', 'Surendranagar', 'Junagadh', 'Valsad', 'Bhuj', 'Palanpur',
  'Satara', 'Ratnagiri', 'Sambhajinagar', 'Nagpur', 'Wardha', 'Yavatmal', 'Dhule', 'Jalgaon', 'Latur',
  'Bilaspur', 'Korba', 'Durg', 'Bokaro', 'Hazaribagh', 'Deoghar', 'Gaya', 'Muzaffarpur', 'Bhagalpur',
  'Krishnanagar', 'Haldia', 'Bardhaman', 'Kharagpur', 'Malda', 'Berhampur', 'Puri', 'Sambalpur', 'Balasore',
  'Udupi', 'Chikkamagaluru', 'Hassan', 'Raichur', 'Bagalkot', 'Karwar', 'Honnavar',
  'Rampur', 'Etawah', 'Hapur', 'Bulandshahr', 'Gonda', 'Bahraich', 'Sitapur', 'Hardoi', 'Mainpuri', 'Shahjahanpur',
  'Bhilwara', 'Chittorgarh', 'Dungarpur', 'Banswara', 'Sawai Madhopur', 'Hanumangarh', 'Sri Ganganagar',
  'Sangrur', 'Barnala', 'Moga', 'Firozpur', 'Fazilka', 'Sri Muktsar Sahib', 'Tarn Taran', 'Kapurthala', 'Rupnagar',
  'Yamunanagar', 'Kurukshetra', 'Sonipat', 'Rohtak', 'Hisar', 'Sirsa', 'Jind', 'Panipat', 'Kaithal',
  'Remote', 'Anywhere'
])]