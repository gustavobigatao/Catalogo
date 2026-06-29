import { Shield } from "lucide-react";
import { useNavigate } from "react-router";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer id="contato" className="bg-black border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PC</span>
              </div>
              <span className="text-white font-bold text-xl">
                Premium Catalog
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Catálogo de apresentação profissional.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contato</h3>
            <p className="text-gray-400 text-sm">
              Entre em contato para mais informações.
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs">
            &copy; {new Date().getFullYear()} Premium Catalog. Todos os direitos
            reservados.
          </p>
          <button
            onClick={() => navigate("/gestao")}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-400 transition-colors text-xs"
          >
            <Shield className="w-3 h-3" />
            Admin
          </button>
        </div>
      </div>
    </footer>
  );
}
