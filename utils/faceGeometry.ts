// utilitaire pour générer la géométrie du visage

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface QuadFace {
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface FaceMesh {
  vertices: Point3D[];
  faces: QuadFace[];
}

export const generateFaceMesh = (rows: number, cols: number): FaceMesh => {
  const vertices: Point3D[] = [];
  const faces: QuadFace[] = [];

  // Fonction de profil CENTRAL (Z en fonction de Y)
  // Y va de +1 (Haut) à -1 (Bas)
  const getCentralZ = (y: number): number => {
    // Front (Aplat)
    if (y > 0.5) return 0.5 - (y - 0.5) * 0.5; // Recule vers le haut

    // Sourcils (Arcade)
    if (y > 0.3) return 0.5 + Math.sin((y - 0.3) * Math.PI) * 0.05;

    // Yeux (Creux)
    if (y > 0.1) return 0.45;

    // Nez (Pointe saillante)
    if (y > -0.2) {
      // -0.2 (base) à 0.1 (racine)
      // Pic à -0.1
      const t = (y - -0.2) / 0.3; // 0..1
      if (t < 0.4) return 0.6 + t * 0.5; // Dessous nez
      return 0.8 - (t - 0.4) * 0.4; // Dessus nez
    }

    // Philtrum (Creux sous nez)
    if (y > -0.25) return 0.55;

    // Lèvres
    if (y > -0.45) {
      // Bouche à -0.35
      const dist = Math.abs(y - -0.35);
      if (dist < 0.05) return 0.65; // Lèvres avancent
      return 0.6;
    }

    // Menton (Bosse)
    if (y > -0.8) return 0.65 - Math.pow(Math.abs(y - -0.65), 2) * 2;

    // Cou
    return 0.3;
  };

  // Fonction de profil TRANSVERSAL (Largeur X en fonction de Z et Y)
  const getWidthScale = (y: number): number => {
    if (y > 0.5) return 0.8; // Front large
    if (y > 0) return 0.75; // Pommettes
    if (y > -0.5) return 0.65 + (y + 0.5) * 0.2; // Mâchoire s'affine vers menton
    return 0.4; // Menton pointu
  };

  for (let i = 0; i <= rows; i++) {
    // Y normalisé de 1 à -1
    const yNorm = 1 - (i / rows) * 2;

    // Décalage Z de base (Profil)
    const zBase = getCentralZ(yNorm);

    // Largeur max à cette hauteur
    const widthMax = getWidthScale(yNorm);

    for (let j = 0; j <= cols; j++) {
      // Angle horizontal (-PI/2 à PI/2 pour face avant)
      const angle = (j / cols) * Math.PI - Math.PI / 2;

      // Facteur d'atténuation du relief sur les côtés
      // Plus on va sur le côté (angle proche de +/- PI/2), moins le profil central compte
      const sideFactor = Math.cos(angle); // 1 au centre, 0 aux oreilles

      // X suit un cylindre/ellipse
      const x = Math.sin(angle) * widthMax;

      // Z est une combinaison du profil central et de la courbure du crâne
      // Courbure crâne de base (Cylindre)
      const zSkull = Math.cos(angle) * 0.5; // Base sphérique

      // On applique le profil central purement au centre, et on fond vers la sphère sur les côtés
      let z = zSkull + (zBase - 0.5) * Math.pow(sideFactor, 2);

      // Creuser les orbites spécifiquement (Override)
      // Yeux approx: y [0.1, 0.3], angle [+/- 0.2, +/- 0.6]
      const absAngle = Math.abs(angle);
      if (yNorm > 0.1 && yNorm < 0.3 && absAngle > 0.2 && absAngle < 0.6) {
        z -= 0.1 * Math.sin(((yNorm - 0.1) / 0.2) * Math.PI); // Creux
      }

      vertices.push({ x, y: yNorm, z });
    }
  }

  // Génération des faces
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const p1 = i * (cols + 1) + j;
      const p2 = p1 + 1;
      const p3 = (i + 1) * (cols + 1) + j;
      const p4 = p3 + 1;
      faces.push({ a: p1, b: p2, c: p4, d: p3 });
    }
  }

  return { vertices, faces };
};
