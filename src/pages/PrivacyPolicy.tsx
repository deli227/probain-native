import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour à l'accueil
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
            POLITIQUE DE CONFIDENTIALITÉ
          </h1>
          <p className="text-gray-500 mb-8">
            Plateforme Probain - Dernière mise à jour : 26 janvier 2026
          </p>

          <div className="prose prose-lg max-w-none text-gray-700">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">1. Responsable du traitement</h2>
              <p>Le responsable du traitement des données est :</p>
              <p className="pl-4">
                <strong>Probain</strong><br />
                contact@probain.ch
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">2. Cadre légal</h2>
              <p>Le traitement des données personnelles est effectué conformément à :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>la Loi fédérale sur la protection des données (LPD – Suisse)</li>
                <li>son ordonnance d'application (OPDo)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">3. Données collectées</h2>
              <p>Probain peut collecter les données suivantes :</p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">a) Données d'identification</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Nom et prénom</li>
                <li>Âge</li>
                <li>Adresse postale ou quartier de résidence</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">b) Données de contact</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Adresse e-mail</li>
                <li>Numéro de téléphone (facultatif)</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">c) Données professionnelles</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Certifications</li>
                <li>Formations suivies ou proposées</li>
                <li>Rôle (sauveteur, formateur, établissement)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">4. Finalité du traitement</h2>
              <p>Les données sont collectées uniquement pour :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>créer et gérer les comptes utilisateurs</li>
                <li>permettre la mise en relation entre utilisateurs</li>
                <li>assurer le bon fonctionnement de la plateforme</li>
                <li>répondre aux obligations légales</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">5. Accès aux données</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Les données des sauveteurs sont accessibles uniquement aux établissements et formateurs inscrits</li>
                <li>Le numéro de téléphone n'est visible que si l'utilisateur l'autorise</li>
                <li>Aucune donnée n'est vendue ni transmise à des tiers non autorisés</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">6. Hébergement et sécurité</h2>
              <p>
                Les données sont hébergées sur des serveurs sécurisés, situés en Suisse ou dans des pays offrant un niveau de protection adéquat.
              </p>
              <p>
                Probain met en œuvre des mesures techniques et organisationnelles pour protéger les données contre tout accès non autorisé.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">7. Durée de conservation</h2>
              <p>Les données sont conservées :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>tant que le compte utilisateur est actif</li>
                <li>puis supprimées ou anonymisées dans un délai raisonnable après suppression du compte</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">8. Droits des utilisateurs</h2>
              <p>Conformément à la LPD, chaque utilisateur dispose des droits suivants :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>droit d'accès à ses données</li>
                <li>droit de rectification</li>
                <li>droit de suppression</li>
                <li>droit d'opposition au traitement</li>
              </ul>
              <p className="mt-4">
                Toute demande peut être adressée à : <a href="mailto:contact@probain.ch" className="text-primary hover:underline">contact@probain.ch</a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">9. Cookies et technologies similaires</h2>
              <p>
                La plateforme peut utiliser des cookies techniques nécessaires à son bon fonctionnement.
              </p>
              <p>
                Aucun cookie publicitaire n'est utilisé sans consentement explicite.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">10. Modifications</h2>
              <p>
                Probain se réserve le droit de modifier la présente politique de confidentialité.
              </p>
              <p>
                Les utilisateurs seront informés de toute modification importante.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">11. Contact</h2>
              <p>
                Pour toute question relative à la protection des données :<br />
                <a href="mailto:contact@probain.ch" className="text-primary hover:underline">contact@probain.ch</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
