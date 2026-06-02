import WizardBody from './WizardBody';
export const metadata = { title: 'Nova Viagem | TMS-Fácil' };
export default async function TripWizardPage({ params }) {
  const { id } = await params;
  return <WizardBody wizardId={id} />;
}
