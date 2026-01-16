# TELL Results Dashboard  
**Autor:** Iván Guerschanik  
**Proyecto Final de Carrera – Ingeniería Bioingeniería – ITBA**  

---

## 1. Descripción General

El **TELL Results Dashboard** es una aplicación web interactiva desarrollada como parte del Proyecto Final de Carrera en Bioingeniería. Su objetivo es proporcionar una herramienta funcional y clara para la **visualización exploratoria de evaluaciones lingüísticas longitudinales**, generadas por la plataforma TELL en el estudio de biomarcadores del habla asociados a enfermedades neurodegenerativas.

La aplicación permite explorar tendencias grupales e individuales, aplicar filtros demográficos, comparar resultados antes y después de una fecha evento, y exportar visualizaciones. El sistema está diseñado para investigación y exploración, no para diagnóstico clínico.

---


## 2. Funcionalidades Principales

- Carga de archivos JSON con evaluaciones del test TELL.
- Filtros dinámicos por sexo, edad y rol.
- Vista general con KPIs poblacionales.
- Gráfico temporal de evolución de composites.
- Análisis Before/After basado en una fecha evento configurable.
- Clasificación automática de riesgo mediante terciles (Normal, At Risk, High Risk).
- Vista individual por participante.
- Exportación del estado del dashboard como imagen PNG.
- Procesamiento 100% en el cliente (sin envío de datos a servidores).

---

## 3. Stack Tecnológico

- **Framework:** Next.js 16 (App Router)  
- **Lenguaje:** TypeScript 5  
- **Librerías de UI:** React 19.2, shadcn/ui, Tailwind CSS 4.1  
- **Visualizaciones:** Recharts 2.15  
- **Utilidades:** date-fns, html2canvas-pro, clsx  
- **Íconos:** Lucide React  

---

## 4. Estructura del Proyecto

/app
 ├── layout.tsx        # Estructura raíz y metadatos
 ├── page.tsx          # Estado global, filtros y render principal
 └── globals.css       # Estilos globales

/components
 ├── header.tsx
 ├── sidebar.tsx
 ├── group-overview.tsx
 ├── individual-view.tsx
 ├── diagnosis-charts.tsx
 └── ui/*              # Componentes base shadcn/ui

/hooks
 ├── use-before-after-stats.ts
 ├── use-mobile.ts
 └── use-toast.ts

/lib
 └── utils.ts          # Utilidades generales

/types
 └── tell-record.ts    # Definición del modelo de datos

/public
 └── tellfavicon.png   # Favicon oficial del dashboard



---

## 5. Formato JSON Esperado

El dashboard recibe un array de registros con la siguiente estructura:

```json
[
  {
    "participant_id": "P001",
    "language": "es",
    "sex": "F",
    "age": 34,
    "role": "Administración",
    "test_date": "2024-01-15",
    "composite_1": 42.5,
    "composite_2": 38.2,
    "composite_3": 35.7
  }
]
Campos obligatorios
| Campo            | Tipo                | Descripción         |
| ---------------- | ------------------- | ------------------- |
| `participant_id` | string              | Identificador único |
| `test_date`      | string (YYYY-MM-DD) | Fecha de evaluación |
| `language        | string              | Idioma              |
| `composite_1`    | number              | Score compuesto     |
| `composite_2`    | number              | Score compuesto     |
| `composite_3`    | number              | Score compuesto     |


Campos opcionales
| Campo      | Tipo   |
| ---------- | ------ |
| `sex`      | string |
| `age`      | number |
| `role`     | string |

-----------------------------

Se pueden usar los archivos "test_dashboard_data_modelo.json" o "test_dashboard_data_modelo blank" que se encuentran en el main para probar el funcionamiento del dashboard.


7. Lógica de Procesamiento y Visualización
7.1 Filtrado dinámico
Los filtros se aplican mediante useMemo sobre originalRecords. Permiten:

Selección por sexo (incluyendo valores en blanco)

Rango de edad dinámico

Selección de rol único o en blanco

7.2 Clasificación de riesgo
El riesgo no proviene del JSON. Se calcula en tiempo real mediante un algoritmo basado en terciles:

Puntajes bajos → Unconcerning

Puntajes medios → Monitor

Puntajes altos → Check

7.3 Análisis temporal (Before/After)
A partir de una fecha evento seleccionada por el usuario:

Se separan registros en “Before” y “After”

Se calculan promedios y diferencias absolutas y relativas

Se muestra una tabla comparativa

7.4 Visualización individual
Cada participante tiene:

Línea temporal propia

Registros ordenados por fecha

Comparación con el contexto grupal

8. Arquitectura de Datos

JSON cargado
      ↓
originalRecords (estado inmutable)
      ↓
filteredRecords (dependiente de filtros demográficos)
      ↓
Cálculos derivados:
   - KPIs
   - Buckets de riesgo
   - Agrupación temporal
   - Before/After
      ↓
Visualizaciones (gráficos, tablas, KPIs)

9. Ejecución del Proyecto
Requisitos previos
Node.js 18.17 o superior

Instalación

npm install
Ejecución en modo desarrollo

npm run dev

Acceder en:

http://localhost:3000


10. Alcance y Limitaciones
Este dashboard es adecuado para:
Visualización exploratoria de datos longitudinales.

Análisis descriptivo inicial.

Preparación de informes y presentaciones.

Trabajo individual con datasets locales.

No está diseñado para:
Diagnóstico clínico.

Análisis estadístico inferencial.

Procesamiento de volúmenes muy grandes (>10.000 registros).

Colaboración multiusuario simultánea.

11. Agradecimientos

Al Ing. Fernando Johann, tutor del proyecto.

A la cátedra del PFC de Bioingeniería del ITBA.
