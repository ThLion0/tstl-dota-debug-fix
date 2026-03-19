"use strict";

import ts from "typescript";
import * as tstl from "typescript-to-lua";

import path from "path";

const SOURCE_DIR = path.join(process.cwd(), "src", "vscripts");

function normalizeFilePath(fileName) {
    const relative = path.relative(SOURCE_DIR, fileName);
    const normalized = relative.replace(/\\/g, "/");
    const gamePath = path.posix.join(
        "scripts/vscripts",
        normalized.replace(/\.ts$/, ".lua")
    );

    return gamePath;
}

/**
 * @typedef tstl.Plugin
 */
const plugin = {
  visitors: {
    /**
     * @param {ts.ClassLikeDeclaration} declaration 
     * @param {tstl.TransformationContext} context 
     */
    [ts.SyntaxKind.ClassDeclaration]: (declaration, context) => {
        const result = context.superTransformStatements(declaration);

        const statements = Array.isArray(result) ? result : [result];

        const newStatements = [];

        for (const stmt of statements) {
            newStatements.push(stmt);
            
            if (
                stmt.kind === tstl.SyntaxKind.AssignmentStatement &&
                stmt.left?.[0]?.index?.value === "name"
            ) {
                const table = stmt.left[0].table;
                const filePath = normalizeFilePath(context.sourceFile.fileName);

                newStatements.push(
                    tstl.createAssignmentStatement(
                        tstl.createTableIndexExpression(
                            table,
                            tstl.createStringLiteral("____file_path")
                        ),
                        tstl.createStringLiteral(filePath)
                    )
                );
            }
        }

        return newStatements;
    }
  }
};

export default plugin;