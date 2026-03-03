"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOpenApiSpec = generateOpenApiSpec;
const path_1 = __importDefault(require("path"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const openapi_spec_1 = require("./openapi.spec");
/**
 * Generates the full OpenAPI spec by merging the base spec with paths
 * extracted from JSDoc @openapi comments in route files.
 */
function generateOpenApiSpec() {
    const isCompiled = __dirname.includes(path_1.default.sep + 'dist' + path_1.default.sep);
    const ext = isCompiled ? 'js' : 'ts';
    const routesGlob = path_1.default.join(__dirname, '..', 'api', 'v1', 'routes', '**', `*.${ext}`);
    return (0, swagger_jsdoc_1.default)({
        definition: openapi_spec_1.baseSpec,
        apis: [routesGlob],
    });
}
//# sourceMappingURL=openapi.generate.js.map