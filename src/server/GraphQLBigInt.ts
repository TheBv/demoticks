import { GraphQLScalarType, GraphQLScalarTypeConfig, ValueNode } from 'graphql';

const scalarConfig: GraphQLScalarTypeConfig<BigInt, string> = {
    name: 'BigInt',
    description: `The \`BigInt\` scalar type represents non-fractional signed whole numeric values.
     Unlike \`Int\` it can represent values larger and smaller than -(2^31) and 2^31 - 1.\n
     It should be querried as a string`,
    serialize(value: any) {
        return value.toString();
    },
    parseValue(value) {
        if (typeof value == 'bigint') {
            return value
        }
        throw new Error("Expected type string or number, found: " + typeof value)

    },
    parseLiteral(ast: ValueNode) {
        if (ast.kind == "StringValue") {
            return BigInt(ast.value)
        }
        throw new Error("Expected type string, found: " + ast.kind)
    }
}

export const GraphQLBigInt = new GraphQLScalarType(scalarConfig);
