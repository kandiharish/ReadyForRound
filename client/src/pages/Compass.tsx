import { useNavigate } from 'react-router'
import { useMe } from '../auth/MeProvider'
import { CareerCompass } from '../components/CareerCompass'
import { PageHeader, Spinner } from '../components/ui'

// Career Compass page: not sure which role suits you? Find out from how you like to work.
export default function Compass() {
  const { catalog } = useMe()
  const navigate = useNavigate()
  if (!catalog) return <Spinner />
  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader eyebrow="Career Compass" title="Not sure what you want to become?"
        subtitle="A short, honest assessment of the work you enjoy, what you've tried and what you're comfortable with, matched to 13 tech roles." />
      <CareerCompass roles={catalog.roles} onPick={(role) => navigate(`/goals?role=${role}`)} />
    </div>
  )
}
