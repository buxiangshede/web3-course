import { Course } from '../types/course'

interface Props {
  course: Course
  onPurchase?: (course: Course) => void
  isPurchased?: boolean
  isPurchasing?: boolean
}

export const CourseCard = ({ course, onPurchase, isPurchased, isPurchasing }: Props) => (
  <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:border-accent/70 hover:shadow-2xl">
    <img
      src={course.cover}
      alt={course.title}
      className="h-48 w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-110"
    />
    <div className="flex flex-1 flex-col gap-3 px-5 py-6">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
        <span>{course.category}</span>
        <span>学员 {course.learners.toLocaleString()}</span>
      </div>
      <h3 className="text-lg font-semibold text-primary">{course.title}</h3>
      <p className="text-sm text-slate-500">{course.description}</p>
      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        {course.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-slate-100 px-3 py-1">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">价格</p>
          <p className="text-2xl font-bold text-accent">{course.priceYD} YD</p>
        </div>
        {onPurchase && (
          <button
            onClick={() => onPurchase(course)}
            disabled={isPurchasing || isPurchased}
            className={`rounded-full px-5 py-2 text-sm font-semibold text-white transition ${
              isPurchased
                ? 'bg-slate-300 cursor-not-allowed text-slate-600'
                : 'bg-accent hover:bg-accent-dark'
            }`}
          >
            {isPurchased ? '已购买' : isPurchasing ? '购买中...' : '购买课程'}
          </button>
        )}
      </div>
    </div>
  </div>
)
