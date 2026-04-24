import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

const libroInicial = {
  id: "",
  titulo: "",
  autor: "",
  isbn: "",
  categoria: "",
  anio: "",
  disponible: true,
};

function App() {
  const [libros, setLibros] = useState([]);
  const [formulario, setFormulario] = useState(libroInicial);
  const [busqueda, setBusqueda] = useState("");
  const [campoOrden, setCampoOrden] = useState("titulo");
  const [arbolCategorias, setArbolCategorias] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [editando, setEditando] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarLibros();
    cargarArbolCategorias();
  }, []);

  const mostrarMensaje = (texto) => {
    setMensaje(texto);
    setError("");
  };

  const mostrarError = (texto) => {
    setError(texto);
    setMensaje("");
  };

  const cargarLibros = async () => {
    try {
      setCargando(true);
      const respuesta = await fetch(`${API_URL}/libros`);
      const datos = await respuesta.json();
      setLibros(datos);
      setCargando(false);
    } catch (err) {
      setCargando(false);
      mostrarError("No se pudo conectar con el backend.");
    }
  };

  const cargarArbolCategorias = async () => {
    try {
      const respuesta = await fetch(`${API_URL}/categorias/arbol`);
      const datos = await respuesta.json();
      setArbolCategorias(datos.arbol);
    } catch (err) {
      mostrarError("No se pudo cargar el árbol de categorías.");
    }
  };

  const buscarLibros = async () => {
    if (busqueda.trim() === "") {
      cargarLibros();
      return;
    }

    try {
      setCargando(true);
      const respuesta = await fetch(
        `${API_URL}/libros/buscar?texto=${encodeURIComponent(busqueda)}`
      );

      const datos = await respuesta.json();
      setLibros(datos.resultados);
      setCargando(false);

      mostrarMensaje(
        `Búsqueda realizada con ${datos.algoritmo}. Resultados encontrados: ${datos.cantidad_resultados}. Complejidad: ${datos.complejidad}`
      );
    } catch (err) {
      setCargando(false);
      mostrarError("Error al buscar libros.");
    }
  };

  const ordenarLibros = async () => {
    try {
      setCargando(true);
      const respuesta = await fetch(
        `${API_URL}/libros/ordenar?campo=${campoOrden}&algoritmo=merge`
      );

      const datos = await respuesta.json();
      setLibros(datos.resultados);
      setCargando(false);

      mostrarMensaje(
        `Libros ordenados por ${campoOrden} usando ${datos.algoritmo}. Complejidad: ${datos.complejidad}`
      );
    } catch (err) {
      setCargando(false);
      mostrarError("Error al ordenar libros.");
    }
  };

  const manejarCambio = (evento) => {
    const { name, value, type, checked } = evento.target;

    setFormulario({
      ...formulario,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const guardarLibro = async (evento) => {
    evento.preventDefault();

    if (
      formulario.id === "" ||
      formulario.titulo.trim() === "" ||
      formulario.autor.trim() === "" ||
      formulario.isbn.trim() === "" ||
      formulario.categoria.trim() === "" ||
      formulario.anio === ""
    ) {
      mostrarError("Todos los campos son obligatorios.");
      return;
    }

    const libro = {
      id: Number(formulario.id),
      titulo: formulario.titulo,
      autor: formulario.autor,
      isbn: formulario.isbn,
      categoria: formulario.categoria,
      anio: Number(formulario.anio),
      disponible: formulario.disponible,
    };

    try {
      const url = editando
        ? `${API_URL}/libros/${libro.id}`
        : `${API_URL}/libros`;

      const metodo = editando ? "PUT" : "POST";

      const respuesta = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(libro),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        mostrarError(datos.detail || "No se pudo guardar el libro.");
        return;
      }

      setFormulario(libroInicial);
      setEditando(false);
      cargarLibros();
      cargarArbolCategorias();

      mostrarMensaje(datos.mensaje);
    } catch (err) {
      mostrarError("Error al guardar el libro.");
    }
  };

  const editarLibro = (libro) => {
    setFormulario({
      id: String(libro.id),
      titulo: libro.titulo,
      autor: libro.autor,
      isbn: libro.isbn,
      categoria: libro.categoria,
      anio: String(libro.anio),
      disponible: libro.disponible,
    });

    setEditando(true);
    mostrarMensaje(`Editando el libro: ${libro.titulo}`);
  };

  const eliminarLibro = async (id) => {
    const confirmar = window.confirm("¿Seguro que deseas eliminar este libro?");

    if (!confirmar) {
      return;
    }

    try {
      const respuesta = await fetch(`${API_URL}/libros/${id}`, {
        method: "DELETE",
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        mostrarError(datos.detail || "No se pudo eliminar el libro.");
        return;
      }

      cargarLibros();
      cargarArbolCategorias();
      mostrarMensaje(datos.mensaje);
    } catch (err) {
      mostrarError("Error al eliminar el libro.");
    }
  };

  const cancelarEdicion = () => {
    setFormulario(libroInicial);
    setEditando(false);
    mostrarMensaje("Edición cancelada.");
  };

  const renderizarArbol = (arbol) => {
    return (
      <ul className="arbol-lista">
        {Object.entries(arbol).map(([categoria, hijos]) => (
          <li key={categoria}>
            <span className="categoria">{categoria}</span>
            {Object.keys(hijos).length > 0 && renderizarArbol(hijos)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <main className="contenedor">
      <section className="encabezado">
        <div>
          <h1>Sistema de Biblioteca Académica</h1>
          <p>
            Proyecto final de Estructuras de Datos y Algoritmos 1: búsqueda,
            ordenamiento, recursión y persistencia.
          </p>
        </div>

        <div className="resumen">
          <strong>{libros.length}</strong>
          <span>libros visibles</span>
        </div>
      </section>

      {mensaje && <div className="mensaje exito">{mensaje}</div>}
      {error && <div className="mensaje error">{error}</div>}

      <section className="grid-principal">
        <section className="tarjeta">
          <h2>{editando ? "Editar libro" : "Registrar libro"}</h2>

          <form onSubmit={guardarLibro} className="formulario">
            <div className="campo">
              <label>ID</label>
              <input
                type="number"
                name="id"
                value={formulario.id}
                onChange={manejarCambio}
                disabled={editando}
                placeholder="Ej: 26"
              />
            </div>

            <div className="campo">
              <label>Título</label>
              <input
                type="text"
                name="titulo"
                value={formulario.titulo}
                onChange={manejarCambio}
                placeholder="Nombre del libro"
              />
            </div>

            <div className="campo">
              <label>Autor</label>
              <input
                type="text"
                name="autor"
                value={formulario.autor}
                onChange={manejarCambio}
                placeholder="Autor del libro"
              />
            </div>

            <div className="campo">
              <label>ISBN</label>
              <input
                type="text"
                name="isbn"
                value={formulario.isbn}
                onChange={manejarCambio}
                placeholder="Ej: 978-1026"
              />
            </div>

            <div className="campo">
              <label>Categoría</label>
              <input
                type="text"
                name="categoria"
                value={formulario.categoria}
                onChange={manejarCambio}
                placeholder="Ingeniería > Programación > Web"
              />
            </div>

            <div className="campo">
              <label>Año</label>
              <input
                type="number"
                name="anio"
                value={formulario.anio}
                onChange={manejarCambio}
                placeholder="2024"
              />
            </div>

            <label className="checkbox">
              <input
                type="checkbox"
                name="disponible"
                checked={formulario.disponible}
                onChange={manejarCambio}
              />
              Disponible
            </label>

            <div className="acciones-formulario">
              <button type="submit">
                {editando ? "Actualizar libro" : "Guardar libro"}
              </button>

              {editando && (
                <button type="button" className="secundario" onClick={cancelarEdicion}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="tarjeta">
          <h2>Árbol de categorías</h2>
          <p className="texto-ayuda">
            Este componente muestra la jerarquía construida desde las categorías
            de los libros. El conteo se realiza con recursión en el backend.
          </p>

          <div className="arbol-contenedor">
            {Object.keys(arbolCategorias).length > 0 ? (
              renderizarArbol(arbolCategorias)
            ) : (
              <p>No hay categorías para mostrar.</p>
            )}
          </div>
        </section>
      </section>

      <section className="tarjeta">
        <div className="barra-herramientas">
          <div className="busqueda">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por título, autor, ISBN o categoría"
            />
            <button onClick={buscarLibros}>Buscar</button>
            <button className="secundario" onClick={cargarLibros}>
              Ver todos
            </button>
          </div>

          <div className="ordenamiento">
            <select
              value={campoOrden}
              onChange={(e) => setCampoOrden(e.target.value)}
            >
              <option value="titulo">Título</option>
              <option value="autor">Autor</option>
              <option value="anio">Año</option>
              <option value="disponible">Disponibilidad</option>
            </select>

            <button onClick={ordenarLibros}>Ordenar con Merge Sort</button>
          </div>
        </div>

        <h2>Catálogo de libros</h2>

        {cargando ? (
          <p>Cargando información...</p>
        ) : (
          <div className="tabla-contenedor">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Autor</th>
                  <th>ISBN</th>
                  <th>Categoría</th>
                  <th>Año</th>
                  <th>Disponible</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {libros.map((libro) => (
                  <tr key={libro.id}>
                    <td>{libro.id}</td>
                    <td>{libro.titulo}</td>
                    <td>{libro.autor}</td>
                    <td>{libro.isbn}</td>
                    <td>{libro.categoria}</td>
                    <td>{libro.anio}</td>
                    <td>
                      <span
                        className={
                          libro.disponible ? "estado disponible" : "estado no-disponible"
                        }
                      >
                        {libro.disponible ? "Sí" : "No"}
                      </span>
                    </td>
                    <td className="acciones-tabla">
                      <button onClick={() => editarLibro(libro)}>Editar</button>
                      <button
                        className="peligro"
                        onClick={() => eliminarLibro(libro.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {libros.length === 0 && (
              <p className="sin-resultados">No se encontraron libros.</p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;