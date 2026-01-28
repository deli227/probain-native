import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

const TermsOfUse = () => {
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
            CONDITIONS D'UTILISATION
          </h1>
          <p className="text-gray-500 mb-8">
            Plateforme Probain - Dernière mise à jour : 26 janvier 2026
          </p>

          <div className="prose prose-lg max-w-none text-gray-700">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">1. Objet</h2>
              <p>
                Les présentes conditions d'utilisation régissent l'accès et l'utilisation de la plateforme Probain, accessible via site web et/ou application mobile, dédiée à la mise en relation des sauveteurs, formateurs et établissements aquatiques en Suisse.
              </p>
              <p>
                En utilisant la plateforme, l'utilisateur accepte sans réserve les présentes conditions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">2. Définitions</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Plateforme :</strong> le site web et/ou l'application Probain</li>
                <li><strong>Utilisateur :</strong> toute personne inscrite sur la plateforme</li>
                <li><strong>Sauveteur :</strong> utilisateur individuel exerçant ou souhaitant exercer une activité de sauvetage</li>
                <li><strong>Formateur :</strong> utilisateur proposant des formations liées à la sécurité aquatique</li>
                <li><strong>Établissement :</strong> structure publique ou privée exploitant une infrastructure aquatique</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">3. Accès à la plateforme</h2>
              <p>L'accès à Probain est :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>gratuit pour les sauveteurs et les formateurs</li>
                <li>réservé aux utilisateurs disposant d'un compte</li>
              </ul>
              <p className="mt-4">
                Probain se réserve le droit de refuser ou suspendre l'accès à tout utilisateur en cas de non-respect des présentes conditions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">4. Création de compte et informations requises</h2>
              <p>Pour créer un compte sauveteur, les informations suivantes peuvent être demandées :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Nom et prénom</li>
                <li>Âge</li>
                <li>Adresse postale (ou quartier de résidence)</li>
                <li>Adresse e-mail</li>
                <li>Numéro de téléphone (facultatif)</li>
              </ul>
              <p className="mt-4">
                L'utilisateur s'engage à fournir des informations exactes et à jour.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">5. Visibilité des profils</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Les profils des sauveteurs sont visibles uniquement par les établissements et les formateurs</li>
                <li>Les données visibles peuvent inclure :
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Nom et prénom</li>
                    <li>Compétences et certifications</li>
                    <li>Quartier ou zone géographique (pas l'adresse exacte)</li>
                    <li>Numéro de téléphone uniquement si le sauveteur choisit de le rendre visible</li>
                  </ul>
                </li>
                <li>Les profils ne sont jamais visibles au grand public.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">6. Utilisation de la plateforme</h2>
              <p>Les utilisateurs s'engagent à :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>utiliser Probain uniquement à des fins professionnelles et légitimes</li>
                <li>ne pas diffuser de contenu faux, trompeur ou illégal</li>
                <li>ne pas utiliser les données des autres utilisateurs à des fins commerciales non autorisées</li>
              </ul>
              <p className="mt-4">
                Tout abus pourra entraîner une suspension ou suppression du compte.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">7. Responsabilités</h2>
              <p>Probain agit comme plateforme de mise en relation et ne garantit pas :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>l'exactitude des informations fournies par les utilisateurs</li>
                <li>la conclusion effective d'une collaboration</li>
                <li>la qualité des prestations réalisées par les utilisateurs</li>
              </ul>
              <p className="mt-4">
                Chaque utilisateur reste seul responsable de ses engagements professionnels.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">8. Propriété intellectuelle</h2>
              <p>
                L'ensemble des contenus, marques, logos et éléments de la plateforme Probain sont protégés par le droit suisse de la propriété intellectuelle.
              </p>
              <p>
                Toute reproduction sans autorisation est interdite.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">9. Suspension et suppression de compte</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>L'utilisateur peut supprimer son compte à tout moment.</li>
                <li>Probain se réserve le droit de suspendre ou supprimer un compte en cas de violation des présentes conditions.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">10. Droit applicable et for juridique</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Les présentes conditions sont soumises au droit suisse.</li>
                <li>Le for juridique est situé en Suisse.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
