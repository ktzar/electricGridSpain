import { getNegativeDataset } from "./Today"

describe('getNegativeDataset', () => {
    it('should return an object with labels, data, radius, and backgroundColor properties', () => {
      const data = {
        'A': -10,
        'B': 20,
        'C': -5,
        'D': 30
      }
      const result = getNegativeDataset(data)
      expect(result).toHaveProperty('labels')
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('radius')
      expect(result).toHaveProperty('backgroundColor')
    })
  
    it('should return correct labels, data, and backgroundColor properties', () => {
      const data = {
        'A': -10,
        'B': 20,
        'C': -5,
        'D': 30
      }
      const result = getNegativeDataset(data)
      expect(result.labels).toEqual(['A', 'C', 'National consumption'])
      expect(result.data).toEqual([-10, -5, -20])
      expect(result.backgroundColor).toEqual([undefined, undefined, 'lightgrey'])
    })
  
    it('should handle empty input', () => {
      const data = {}
      const result = getNegativeDataset(data)
      expect(result.labels).toEqual(['National consumption'])
      expect(result.data).toEqual([-0])
      expect(result.backgroundColor).toEqual(['lightgrey'])
    })
  
    it('should handle input with only positive values', () => {
      const data = {
        'A': 10,
        'B': 20,
        'C': 5,
        'D': 30
      }
      const result = getNegativeDataset(data)
      expect(result.labels).toEqual(['National consumption'])
      expect(result.data).toEqual([-65])
      expect(result.backgroundColor).toEqual(['lightgrey'])
    })
  
    it('should handle input with only negative values', () => {
      const data = {
        'A': -10,
        'B': -20,
        'C': -5,
        'D': -30
      }
      const result = getNegativeDataset(data)
      expect(result.labels).toEqual(['A', 'B', 'C', 'D', 'National consumption'])
      expect(result.data).toEqual([-10, -20, -5, -30, 130])
      expect(result.backgroundColor).toEqual([
        undefined, undefined, undefined, undefined, 'lightgrey'
      ])
    })
  })
  