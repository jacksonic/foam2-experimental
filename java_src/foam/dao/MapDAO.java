package foam.dao;

import foam.core.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import foam.mlang.order.Comparator;
import foam.mlang.predicate.Predicate;

public class MapDAO extends AbstractDAO {
  private Map<Object, FObject> data_ = null;

  private synchronized void data_factory() {
    if ( data_ == null ) {
      data_ = (Map<Object, FObject>)getX().create(ConcurrentHashMap.class);
    }
  }

  private Map<Object, FObject> getData() {
    if ( data_ == null ) {
      data_factory();
    }
    return data_;
  }

  public void setData(Map<Object, FObject> data) {
    data_ = data;
  }

  public FObject put(FObject obj) {
    getData().put(getPrimaryKey().get(obj), obj);
    return obj;
  }

  public FObject remove(FObject obj) {
    getData().remove(getPrimaryKey().get(obj));
    return obj;
  }

  public FObject find(Object id) {
    FObject result = getData().get(id);
    return result;
  }

  public Sink select(Sink sink, Integer skip, Integer limit, Comparator order, Predicate predicate) {
    if ( sink == null ) {
      sink = new ListSink();
    }

    Sink decorated = decorateSink_(sink, skip, limit, order, predicate);

    FlowControl fc = (FlowControl)getX().create(FlowControl.class);

    for ( FObject obj : getData().values() ) {
      if ( fc.getStopped() || fc.getErrorEvt() != null ) {
        break;
      }

      decorated.put(obj, fc);
    }

    if ( fc.getErrorEvt() != null ) {
      decorated.error();
      return sink;
    }

    decorated.eof();

    return sink;
  }

  public void removeAll(Integer skip, Integer limit, Comparator order, Predicate predicate) {
    setData(null);
  }

  public void pipe(Sink s) {
    // TODO
  }
}
