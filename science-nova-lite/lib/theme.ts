export const theme = {
  background: {
    primary: "bg-gray-200",
    secondary: "bg-gray-300",
    card: "bg-gray-100",
    transparent: "bg-gray-100/80",
  },
  border: {
    primary: "border-gray-400",
    secondary: "border-gray-500",
    accent: "border-blue-600",
    hover: "border-green-600",
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
  },
  gradient: {
    primary: "bg-gradient-to-r from-blue-700 to-blue-800",
    secondary: "bg-gradient-to-r from-green-700 to-green-800",
    accent: "bg-gradient-to-r from-red-700 to-red-800",
    header: "bg-gradient-to-r from-blue-600 to-green-600",
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
