"use client"

interface GradeSelectorProps {
  value: number | null
  onChange: (grade: number | null) => void
  placeholder?: string
  className?: string
  required?: boolean
}

export function GradeSelector({ value, onChange, placeholder = "Select Grade", className = "", required = false }: GradeSelectorProps) {
  const grades = Array.from({ length: 6 }, (_, i) => i + 1)
  
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
      className={`border rounded px-2 py-1 text-sm ${className}`}
      required={required}
    >
      <option value="">{placeholder}</option>
      {grades.map(grade => (
        <option key={grade} value={grade}>
          Grade {grade}
        </option>
      ))}
    </select>
  )
}