import EmailViewer from './EmailViewer'
import { EMAIL_IDS } from './emailIds'

export function generateStaticParams() {
  return EMAIL_IDS.map((id) => ({ id }))
}

export default function EmailPage({
  params,
}: {
  params: { id: string }
}) {
  return <EmailViewer id={params.id} />
}
