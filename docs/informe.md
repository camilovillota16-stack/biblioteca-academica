# Informe del Proyecto Final

## Sistema de Gestión y Consulta de Biblioteca Académica

## 1. Descripción general

El proyecto consiste en una aplicación web para gestionar y consultar libros académicos de una biblioteca universitaria.

La aplicación permite registrar, listar, buscar, ordenar, editar y eliminar libros. También permite visualizar una jerarquía de categorías en forma de árbol.

El sistema fue desarrollado con React en el frontend y FastAPI en el backend. Para la persistencia de datos se utilizó un archivo JSON.

## 2. Problema planteado

Una biblioteca académica necesita organizar su catálogo de libros para facilitar la consulta por parte de estudiantes y docentes.

El sistema permite buscar libros por diferentes criterios, ordenarlos según campos importantes y explorar categorías organizadas jerárquicamente.

## 3. Estructura de datos usada

La estructura principal utilizada es una lista de libros.

Cada libro se representa como un objeto con los siguientes campos:

- id
- título
- autor
- ISBN
- categoría
- año
- disponibilidad

También se usa una estructura tipo árbol para representar categorías y subcategorías.

Ejemplo:

```text
Ingeniería
  Programación
    Desarrollo Web