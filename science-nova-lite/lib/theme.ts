export const theme = {
  background: {
    primary: "bg-gray-200",
    secondary: "bg-gray-300",
    card: "bg-gray-100",
    transparent: "bg-gray-100/80",
    glass: "bg-white/80 backdrop-blur-glass",
    subtle: "bg-subtle-texture",
  },
  border: {
    primary: "border-gray-400",
    secondary: "border-gray-500",
    accent: "border-blue-600",
    hover: "border-green-600",
    soft: "border-gray-200/60",
    highlight: "border-blue-300/50",
  },
  text: {
    primary: "text-blue-800",
    secondary: "text-green-700",
    accent: "text-red-700",
    muted: "text-orange-600",
    dark: "text-gray-800",
    light: "text-gray-600",
  },
  button: {
    primary: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
    secondary: "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800",
    accent: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800",
    warning: "bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800",
  },
  input: {
    background: "bg-gray-100",
    border: "border-gray-400",
    text: "text-blue-800",
    placeholder: "placeholder:text-gray-500",
  },
  icon: {
    primary: "text-blue-600",
    secondary: "text-green-600",
    accent: "text-red-600",
    warning: "text-orange-600",
  },
  hover: {
    text: "hover:text-blue-600",
    background: "hover:bg-gray-200",
    border: "hover:border-blue-600",
    gentle: "hover:scale-[1.02] hover:shadow-soft-lg transition-all duration-300",
  },
  gradient: {
    primary: "bg-gradient-to-r from-blue-700 to-blue-800",
    secondary: "bg-gradient-to-r from-green-700 to-green-800",
    accent: "bg-gradient-to-r from-red-700 to-red-800",
    header: "bg-gradient-to-r from-blue-600 to-green-600",
    success: "bg-gradient-to-br from-success-100 to-success-500",
    progress: "bg-gradient-to-r from-progress-warm to-progress-cool",
  },
  // Enhanced Color Psychology System
  psychology: {
    success: {
      bg: "bg-success-50",
      text: "text-success-700",
      border: "border-success-200",
      gradient: "bg-gradient-to-br from-success-100 via-success-50 to-success-100",
      shadow: "shadow-glow-green",
    },
    progress: {
      bg: "bg-gradient-to-r from-orange-100 to-blue-100",
      gradient: "bg-gradient-to-r from-progress-warm via-yellow-400 to-progress-cool",
      glow: "shadow-glow animate-subtle-glow",
    },
    interactive: {
      hover: "hover:scale-[1.02] hover:shadow-soft-lg transition-all duration-300 ease-out",
      focus: "focus:ring-2 focus:ring-blue-300/50 focus:ring-offset-2",
      active: "active:scale-[0.98] transition-transform duration-150",
    },
  },
  // Subject-Based Color System
  subjects: {
    physics: {
      bg: "bg-subject-physics-50",
      text: "text-subject-physics-700",
      border: "border-subject-physics-300",
      gradient: "bg-gradient-to-br from-subject-physics-100 to-subject-physics-200",
      shadow: "shadow-glow",
      accent: "bg-subject-physics-500",
    },
    chemistry: {
      bg: "bg-subject-chemistry-50", 
      text: "text-subject-chemistry-700",
      border: "border-subject-chemistry-300",
      gradient: "bg-gradient-to-br from-subject-chemistry-100 to-subject-chemistry-200",
      shadow: "shadow-glow-purple",
      accent: "bg-subject-chemistry-500",
    },
    biology: {
      bg: "bg-subject-biology-50",
      text: "text-subject-biology-700", 
      border: "border-subject-biology-300",
      gradient: "bg-gradient-to-br from-subject-biology-100 to-subject-biology-200",
      shadow: "shadow-glow-green",
      accent: "bg-subject-biology-500",
    },
    math: {
      bg: "bg-subject-math-50",
      text: "text-subject-math-700",
      border: "border-subject-math-300", 
      gradient: "bg-gradient-to-br from-subject-math-100 to-subject-math-200",
      shadow: "shadow-glow-orange",
      accent: "bg-subject-math-500",
    },
  },
  // Modern Card Design System
  cards: {
    glass: "bg-white/80 backdrop-blur-glass border border-white/20 shadow-soft-lg",
    elevated: {
      low: "shadow-elevation-1",
      medium: "shadow-elevation-2", 
      high: "shadow-elevation-3",
      floating: "shadow-elevation-4",
      modal: "shadow-elevation-5",
    },
    rounded: {
      soft: "rounded-2xl",
      modern: "rounded-3xl", 
    },
    interactive: "hover:shadow-elevation-3 hover:scale-[1.01] transition-all duration-300 ease-out",
  },
  badge: {
    grade1: "bg-gradient-to-r from-red-500 to-red-600",
    grade2: "bg-gradient-to-r from-orange-500 to-orange-600",
    grade3: "bg-gradient-to-r from-blue-500 to-blue-600",
    grade4: "bg-gradient-to-r from-green-500 to-green-600",
    grade5: "bg-gradient-to-r from-purple-500 to-purple-600",
    grade6: "bg-gradient-to-r from-indigo-500 to-indigo-600",
    biology: "bg-gradient-to-r from-green-600 to-green-700",
    physics: "bg-gradient-to-r from-blue-600 to-blue-700",
    chemistry: "bg-gradient-to-r from-purple-600 to-purple-700",
    geology: "bg-gradient-to-r from-orange-600 to-orange-700",
    meteorology: "bg-gradient-to-r from-cyan-600 to-cyan-700",
    astronomy: "bg-gradient-to-r from-indigo-600 to-indigo-700",
    anatomy: "bg-gradient-to-r from-red-600 to-red-700",
  },
} as const

export const getGradeColor = (grade: number) => {
  const gradeColors = {
    1: theme.badge.grade1,
    2: theme.badge.grade2,
    3: theme.badge.grade3,
    4: theme.badge.grade4,
    5: theme.badge.grade5,
    6: theme.badge.grade6,
  }
  return gradeColors[grade as keyof typeof gradeColors] || theme.badge.grade1
}

export const getAreaColor = (area: string) => {
  const areaColors = {
    Biology: theme.badge.biology,
    Physics: theme.badge.physics,
    Chemistry: theme.badge.chemistry,
    Geology: theme.badge.geology,
    Meteorology: theme.badge.meteorology,
    Astronomy: theme.badge.astronomy,
    Anatomy: theme.badge.anatomy,
  }
  return areaColors[area as keyof typeof areaColors] || theme.badge.biology
}

// Enhanced Subject-Based Color Psychology
export const getSubjectTheme = (subject: string) => {
  const normalized = subject.toLowerCase()
  if (normalized.includes('physics') || normalized.includes('physical')) return theme.subjects.physics
  if (normalized.includes('chemistry') || normalized.includes('chemical')) return theme.subjects.chemistry  
  if (normalized.includes('biology') || normalized.includes('bio')) return theme.subjects.biology
  if (normalized.includes('math') || normalized.includes('mathematics')) return theme.subjects.math
  return theme.subjects.physics // default fallback
}

// Progress and Success State Helpers
export const getProgressColors = (percentage: number) => {
  if (percentage >= 100) return theme.psychology.success
  if (percentage >= 75) return { ...theme.psychology.progress, intensity: 'high' }
  if (percentage >= 50) return { ...theme.psychology.progress, intensity: 'medium' }
  return { ...theme.psychology.progress, intensity: 'low' }
}
