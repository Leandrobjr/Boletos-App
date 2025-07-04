import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const boletos = [
  {
    id: 1,
    numero: "123456",
    status: "pendente",
    comprovanteUrl: "https://exemplo.com/comprovante1.pdf",
  },
  {
    id: 2,
    numero: "654321",
    status: "cancelado",
    comprovanteUrl: null,
  },
];

export default function BoletoDropdownExample() {
  const visualizarComprovante = (boleto) => {
    if (boleto.comprovanteUrl) {
      window.open(boleto.comprovanteUrl, "_blank");
    } else {
      alert("Sem comprovante disponível.");
    }
  };

  const baixarPagamento = (boleto) => {
    alert(`Baixar pagamento do boleto ${boleto.numero}`);
  };

  const cancelarBoleto = (boleto) => {
    alert(`Cancelar boleto ${boleto.numero}`);
  };

  const excluirBoleto = (boleto) => {
    alert(`Excluir boleto ${boleto.numero}`);
  };

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Exemplo: Tabela de Boletos com Dropdown Shadcn</h2>
      <table className="w-full border text-center">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4">Número</th>
            <th className="py-2 px-4">Status</th>
            <th className="py-2 px-4">Ações</th>
          </tr>
        </thead>
        <tbody>
          {boletos.map((boleto) => (
            <tr key={boleto.id} className="border-b">
              <td className="py-2 px-4">{boleto.numero}</td>
              <td className="py-2 px-4">{boleto.status}</td>
              <td className="py-2 px-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Ações</button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => visualizarComprovante(boleto)} disabled={!boleto.comprovanteUrl}>
                      Visualizar comprovante
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => baixarPagamento(boleto)}>
                      Baixar pagamento
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => cancelarBoleto(boleto)} disabled={boleto.status === "cancelado"}>
                      Cancelar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => excluirBoleto(boleto)} disabled={boleto.status !== "cancelado"}>
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 