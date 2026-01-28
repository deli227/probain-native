
export const ErrorState = () => {
  return (
    <div className="min-h-screen bg-primary-dark flex items-center justify-center">
      <div className="text-white text-center">
        <h2 className="text-xl mb-4">Une erreur est survenue lors du chargement du profil.</h2>
        <button 
          onClick={() => window.location.reload()}
          className="bg-white text-primary px-4 py-2 rounded-md hover:bg-gray-100"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
};
