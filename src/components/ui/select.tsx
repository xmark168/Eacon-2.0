import React from 'react'

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}

interface SelectTriggerProps {
  className?: string
  children: React.ReactNode
}

interface SelectContentProps {
  children: React.ReactNode
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
}

interface SelectValueProps {}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectTrigger) {
          return React.cloneElement(child as React.ReactElement<any>, { 
            value, 
            onValueChange,
            children: React.Children.toArray(children).find(c => 
              React.isValidElement(c) && c.type === SelectContent
            )
          })
        }
        return null
      })}
    </div>
  )
}

export const SelectTrigger: React.FC<SelectTriggerProps & { 
  value?: string, 
  onValueChange?: (value: string) => void 
}> = ({ 
  className = '', 
  children, 
  value, 
  onValueChange 
}) => {
  // Extract SelectContent from children to get SelectItems
  const selectContent = React.Children.toArray(children).find(child => 
    React.isValidElement(child) && child.type === SelectContent
  )
  
  const selectItems = selectContent && React.isValidElement(selectContent) 
    ? React.Children.toArray(selectContent.props.children)
    : []

  return (
    <select 
      value={value} 
      onChange={(e) => onValueChange?.(e.target.value)}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {selectItems.map((item, index) => {
        if (React.isValidElement(item) && item.type === SelectItem) {
          return (
            <option key={index} value={item.props.value}>
              {item.props.children}
            </option>
          )
        }
        return null
      })}
    </select>
  )
}

export const SelectContent: React.FC<SelectContentProps> = ({ children }) => {
  return <>{children}</>
}

export const SelectItem: React.FC<SelectItemProps> = ({ value, children }) => {
  return (
    <option value={value}>
      {children}
    </option>
  )
}

export const SelectValue: React.FC<SelectValueProps> = () => {
  return null // This is handled by the select element itself
} 