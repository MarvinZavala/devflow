export type Priority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  description?: string
  priority: Priority
  columnId: string
  orderIndex: number
}

export interface Column {
  id: string
  title: string
  orderIndex: number
  tasks: Task[]
}

export interface BoardData {
  columns: Column[]
}
