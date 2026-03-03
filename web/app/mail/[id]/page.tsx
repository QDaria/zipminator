import EmailViewer from './EmailViewer'
import { EMAIL_IDS } from './emailIds'

export function generateStaticParams() {
  return EMAIL_IDS.map((id) => ({ id }))
}

export default async function EmailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <EmailViewer id={id} />
}
