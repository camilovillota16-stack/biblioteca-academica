from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import json


# CONFIGURACIÓN PRINCIPAL DE LA API

app = FastAPI(
    title="Consulta de Biblioteca Académica",
    description="Proyecto final de Estructuras de Datos y Algoritmos, permite registrar, consultar, buscar, ordenar y explorar libros académicos",
    version="1"
)

# Permite que el frontend en React pueda conectarse al backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ruta segura al archivo JSON
BASE_DIR = Path(__file__).resolve().parent
RUTA_LIBROS = BASE_DIR / "data" / "libros.json"

# MODELO DE DATOS

class Libro(BaseModel):
    id: int
    titulo: str
    autor: str
    isbn: str
    categoria: str
    anio: int
    disponible: bool


def convertir_libro_a_diccionario(libro: Libro):
    """
    Convierte un objeto Libro en diccionario.
    Compatible con versiones nuevas y anteriores de Pydantic.
    """
    if hasattr(libro, "model_dump"):
        return libro.model_dump()
    return libro.dict()


# PERSISTENCIA EN JSON

def cargar_libros():
    """
    Lee los libros almacenados en el archivo libros.json.
    """
    with open(RUTA_LIBROS, "r", encoding="utf-8") as archivo:
        return json.load(archivo)


def guardar_libros(libros):
    """
    Guarda la lista de libros en el archivo libros.json.
    """
    with open(RUTA_LIBROS, "w", encoding="utf-8") as archivo:
        json.dump(libros, archivo, indent=4, ensure_ascii=False)


# ALGORITMO DE BÚSQUEDA LINEAL

def busqueda_lineal(libros, texto):
    """
    Algoritmo de búsqueda lineal.

    Recorre todos los libros y busca el texto ingresado en:
    - título
    - autor
    - ISBN
    - categoría

    Complejidad temporal:
    O(n), donde n es la cantidad de libros.
    """
    resultados = []
    texto = texto.lower()

    for libro in libros:
        titulo = libro["titulo"].lower()
        autor = libro["autor"].lower()
        isbn = libro["isbn"].lower()
        categoria = libro["categoria"].lower()

        if (
            texto in titulo
            or texto in autor
            or texto in isbn
            or texto in categoria
        ):
            resultados.append(libro)

    return resultados

# ALGORITMO MERGE SORT

def obtener_valor(libro, campo):
    """
    Obtiene el valor por el cual se va a ordenar cada libro.
    """
    if campo == "titulo":
        return libro["titulo"].lower()

    if campo == "autor":
        return libro["autor"].lower()

    if campo == "anio":
        return libro["anio"]

    if campo == "disponible":
        return libro["disponible"]

    return libro["titulo"].lower()


def merge_sort(libros, campo):
    """
    Algoritmo Merge Sort implementado manualmente.

    Divide la lista en mitades, ordena cada mitad y luego las combina.

    Complejidad temporal:
    O(n log n), donde n es la cantidad de libros.
    """
    if len(libros) <= 1:
        return libros

    mitad = len(libros) // 2

    izquierda = libros[:mitad]
    derecha = libros[mitad:]

    izquierda_ordenada = merge_sort(izquierda, campo)
    derecha_ordenada = merge_sort(derecha, campo)

    return mezclar(izquierda_ordenada, derecha_ordenada, campo)


def mezclar(izquierda, derecha, campo):
    """
    Une dos listas ya ordenadas.
    """
    resultado = []
    i = 0
    j = 0

    while i < len(izquierda) and j < len(derecha):
        if obtener_valor(izquierda[i], campo) <= obtener_valor(derecha[j], campo):
            resultado.append(izquierda[i])
            i += 1
        else:
            resultado.append(derecha[j])
            j += 1

    while i < len(izquierda):
        resultado.append(izquierda[i])
        i += 1

    while j < len(derecha):
        resultado.append(derecha[j])
        j += 1

    return resultado

# ÁRBOL DE CATEGORÍAS Y RECURSIÓN

def construir_arbol_categorias(libros):
    """
    Construye un árbol de categorías usando textos como:

    Ingeniería > Programación > Desarrollo Web
    """
    arbol = {}

    for libro in libros:
        partes = [parte.strip() for parte in libro["categoria"].split(">")]
        nodo_actual = arbol

        for parte in partes:
            if parte not in nodo_actual:
                nodo_actual[parte] = {}

            nodo_actual = nodo_actual[parte]

    return arbol


def contar_nodos_recursivo(arbol):
    """
    Cuenta las categorías y subcategorías de forma recursiva.

    Caso base:
    Cuando una categoría no tiene subcategorías, el ciclo interno no continúa.

    Llamada recursiva:
    La función se llama a sí misma para recorrer los hijos de cada categoría.

    Complejidad temporal:
    O(n), donde n es la cantidad de nodos del árbol.
    """
    total = 0

    for categoria in arbol:
        total += 1
        total += contar_nodos_recursivo(arbol[categoria])

    return total

# ENDPOINT PRINCIPAL

@app.get("/")
def inicio():
    return {
        "mensaje": "API del Sistema de Gestión y Consulta de Biblioteca Académica",
        "estado": "Funcionando correctamente"
    }


# ENDPOINTS DE LIBROS

@app.get("/libros")
def listar_libros():
    """
    Lista todos los libros registrados.
    """
    return cargar_libros()


@app.get("/libros/buscar")
def buscar_libros(texto: str = Query(..., description="Texto a buscar")):
    """
    Busca libros por título, autor, ISBN o categoría.
    """
    libros = cargar_libros()
    resultados = busqueda_lineal(libros, texto)

    return {
        "algoritmo": "Búsqueda lineal",
        "complejidad": "O(n)",
        "texto_buscado": texto,
        "cantidad_resultados": len(resultados),
        "resultados": resultados
    }


@app.get("/libros/ordenar")
def ordenar_libros(
    campo: str = Query("titulo", description="titulo, autor, anio o disponible"),
    algoritmo: str = Query("merge", description="merge")
):
    """
    Ordena los libros usando Merge Sort.
    """
    libros = cargar_libros()

    campos_validos = ["titulo", "autor", "anio", "disponible"]

    if campo not in campos_validos:
        raise HTTPException(
            status_code=400,
            detail="Campo inválido. Use: titulo, autor, anio o disponible."
        )

    if algoritmo != "merge":
        raise HTTPException(
            status_code=400,
            detail="Algoritmo inválido. En este proyecto se implementa merge."
        )

    libros_ordenados = merge_sort(libros, campo)

    return {
        "algoritmo": "Merge Sort",
        "campo": campo,
        "complejidad": "O(n log n)",
        "cantidad_resultados": len(libros_ordenados),
        "resultados": libros_ordenados
    }


@app.get("/categorias/arbol")
def obtener_arbol_categorias():
    """
    Retorna el árbol de categorías y cuenta sus nodos usando recursión.
    """
    libros = cargar_libros()
    arbol = construir_arbol_categorias(libros)
    total_categorias = contar_nodos_recursivo(arbol)

    return {
        "descripcion": "Árbol de categorías construido a partir de los libros",
        "recursion": "Conteo recursivo de categorías y subcategorías",
        "complejidad": "O(n)",
        "total_categorias_y_subcategorias": total_categorias,
        "arbol": arbol
    }


@app.get("/libros/{id_libro}")
def consultar_libro(id_libro: int):
    """
    Consulta un libro por su ID.
    """
    libros = cargar_libros()

    for libro in libros:
        if libro["id"] == id_libro:
            return libro

    raise HTTPException(status_code=404, detail="Libro no encontrado")


@app.post("/libros")
def crear_libro(libro: Libro):
    """
    Crea un nuevo libro.
    """
    libros = cargar_libros()

    for item in libros:
        if item["id"] == libro.id:
            raise HTTPException(
                status_code=400,
                detail="Ya existe un libro con ese ID."
            )

    nuevo_libro = convertir_libro_a_diccionario(libro)
    libros.append(nuevo_libro)
    guardar_libros(libros)

    return {
        "mensaje": "Libro creado correctamente",
        "libro": nuevo_libro
    }


@app.put("/libros/{id_libro}")
def actualizar_libro(id_libro: int, libro_actualizado: Libro):
    """
    Actualiza un libro existente.
    """
    libros = cargar_libros()

    for i in range(len(libros)):
        if libros[i]["id"] == id_libro:
            libros[i] = convertir_libro_a_diccionario(libro_actualizado)
            guardar_libros(libros)

            return {
                "mensaje": "Libro actualizado correctamente",
                "libro": libros[i]
            }

    raise HTTPException(status_code=404, detail="Libro no encontrado")


@app.delete("/libros/{id_libro}")
def eliminar_libro(id_libro: int):
    """
    Elimina un libro por su ID.
    """
    libros = cargar_libros()

    for libro in libros:
        if libro["id"] == id_libro:
            libros.remove(libro)
            guardar_libros(libros)

            return {
                "mensaje": "Libro eliminado correctamente",
                "id_eliminado": id_libro
            }

    raise HTTPException(status_code=404, detail="Libro no encontrado")