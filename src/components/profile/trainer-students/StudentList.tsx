import { Check, X } from 'lucide-react';
import { StudentCard } from './StudentCard';
import { EmptyState } from './EmptyState';
import type { StudentData, SelectedStudent } from './types';

// Liste d'élèves
export const StudentList = ({
  students,
  selectedStudents,
  onToggleSelect,
  onSendMessage,
  onToggleAll,
  onViewDetails,
  emptyType,
}: {
  students: StudentData[];
  selectedStudents: SelectedStudent[];
  onToggleSelect: (studentId: string) => void;
  onSendMessage: (studentId: string) => void;
  onToggleAll: () => void;
  onViewDetails: (student: StudentData) => void;
  emptyType: 'active' | 'all';
}) => {
  if (students.length === 0) return <EmptyState type={emptyType} />;

  const allSelected = students.every(s =>
    selectedStudents.some(sel => sel.student_id === s.student_id)
  );

  return (
    <>
      {/* Sélectionner tout - discret */}
      <div className="flex justify-end mb-3">
        <button
          onClick={onToggleAll}
          className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
        >
          {allSelected ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
          {allSelected ? 'Désélectionner' : 'Tout sélectionner'}
        </button>
      </div>

      <div className="space-y-3">
        {students.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            isSelected={selectedStudents.some(s => s.student_id === student.student_id)}
            onToggleSelect={() => onToggleSelect(student.student_id)}
            onSendMessage={() => onSendMessage(student.student_id)}
            onViewDetails={() => onViewDetails(student)}
          />
        ))}
      </div>
    </>
  );
};
