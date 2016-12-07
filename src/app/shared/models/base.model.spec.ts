import 'reflect-metadata';

import { BaseModel } from './base.model';
import { FieldMapper } from '../decorators/field-mapper.decorator';


describe('Base model', () => {
  @FieldMapper({
    testfield1: 'field1',
    testfield2: 'field2',
  })
  class TestModel extends BaseModel {
    public field1: string;
    public field2: string;
  }

  const params = {
    id: 'id',
    testfield1: 'test',
    testfield2: 'test2'
  };

  it('should parse params correctly', () => {
    const testModel = new TestModel(params);

    expect(testModel.id).toBe(params.id);
    expect(testModel.field1).toBe(params.testfield1);
    expect(testModel.field2).toBe(params.testfield2);
  });

  it('should be serialized correctly', () => {
    const testModel = new TestModel(params);
    expect(testModel.serialize()).toEqual(params);
  });
});