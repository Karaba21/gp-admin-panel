export interface Auto {
    id: number;
    marca: string;
    modelo: string;
    año: number;
    precio: number;
    descripcion: string | null;
    imagenes: string[];
    en_oferta: boolean;
    precio_oferta: number | null;
    vendido: boolean;
    reservado: boolean;
}
